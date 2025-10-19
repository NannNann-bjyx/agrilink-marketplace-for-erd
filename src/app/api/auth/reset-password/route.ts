import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password reset API called');
    
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json({ 
        message: 'Reset token and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        message: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Find user with valid reset token
    const users = await sql`
      SELECT id, name, email, "passwordResetExpires" 
      FROM users 
      WHERE "passwordResetToken" = ${token}
    `;

    if (users.length === 0) {
      return NextResponse.json({ 
        message: 'Invalid or expired reset token' 
      }, { status: 400 });
    }

    const user = users[0];

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(user.passwordResetExpires);
    
    if (now > expiresAt) {
      // Clear expired token
      await sql`
        UPDATE users 
        SET 
          "passwordResetToken" = NULL,
          "passwordResetExpires" = NULL
        WHERE id = ${user.id}
      `;
      
      return NextResponse.json({ 
        message: 'Reset token has expired. Please request a new password reset.' 
      }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await sql`
      UPDATE users 
      SET 
        "passwordHash" = ${hashedPassword},
        "passwordResetToken" = NULL,
        "passwordResetExpires" = NULL,
        "updatedAt" = NOW()
      WHERE id = ${user.id}
    `;

    console.log('✅ Password reset successfully for user:', user.email);

    return NextResponse.json({ 
      message: 'Password has been reset successfully. You can now sign in with your new password.' 
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
