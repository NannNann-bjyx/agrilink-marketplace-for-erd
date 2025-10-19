import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { checkEmailVerification } from '@/lib/api-middleware';
import { sql } from '@/lib/db';



export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Verification request API called');

    // Check email verification for submitting verification requests
    const { user, error } = await checkEmailVerification(request, 'submit_verification');
    if (error) return error;
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;
    console.log('✅ User authenticated for verification request:', userId);

    const body = await request.json();
    const userEmail = user.email;
    const userType = user.userType;
    const accountType = user.accountType;
    
    // Fetch user's name from database
    const userResult = await sql`
      SELECT name FROM users WHERE id = ${userId} LIMIT 1
    `;
    
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userName = userResult[0].name;
    
    const {
      requestType = 'agrilink_verification',
      status = 'under_review',
      submittedAt = new Date().toISOString(),
      verificationDocuments,
      businessInfo,
      phoneVerified = false
    } = body;

    // Idempotency guard: if there's already a pending/under_review request, return it instead of inserting a new one
    const existingOpen = await sql`
      SELECT id, status, "submittedAt"
      FROM verification_requests
      WHERE "userId" = ${userId}
        AND status IN ('pending', 'under_review')
      ORDER BY "submittedAt" DESC
      LIMIT 1
    `;

    if (existingOpen.length > 0) {
      console.log('ℹ️ Existing open verification request found, returning existing ID:', existingOpen[0].id);
      // Ensure user_verification reflects under_review state
      await sql`
        UPDATE user_verification 
        SET 
          "verificationStatus" = 'under_review',
          "verificationSubmitted" = true,
          "updatedAt" = NOW()
        WHERE "userId" = ${userId}
      `;
      return NextResponse.json({
        success: true,
        message: 'Verification request already submitted',
        requestId: existingOpen[0].id,
        existing: true
      });
    }

    // Insert verification request into database
    console.log('🔄 Inserting verification request...');
    const result = await sql`
      INSERT INTO verification_requests (
        "userId",
        "userEmail",
        "userName",
        "userType",
        "accountType",
        "requestType",
        status,
        "submittedAt",
        "verificationDocuments",
        "businessInfo",
        "phoneVerified",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${userId},
        ${userEmail},
        ${userName},
        ${userType},
        ${accountType},
        ${requestType},
        ${status},
        ${submittedAt},
        ${verificationDocuments ? JSON.stringify(verificationDocuments) : null},
        ${businessInfo ? JSON.stringify(businessInfo) : null},
        ${phoneVerified},
        NOW(),
        NOW()
      )
      RETURNING id
    `;
    console.log('✅ Verification request inserted with ID:', result[0].id);

    // Update user's verification status in user_verification table
    console.log('🔄 Updating user verification status...');
    await sql`
      UPDATE user_verification 
      SET 
        "verificationStatus" = 'under_review',
        "verificationSubmitted" = true,
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
    console.log('✅ User verification status updated');

    // Note: Skipping users table flags (agriLinkVerificationRequested*) as these columns do not exist

    return NextResponse.json({
      success: true,
      message: 'Verification request submitted successfully',
      requestId: result[0].id
    });

  } catch (error: any) {
    console.error('Error creating verification request:', error);
    return NextResponse.json(
      { error: 'Failed to create verification request' },
      { status: 500 }
    );
  }
}
