import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests, userVerification, users } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { checkEmailVerification } from '@/lib/api-middleware';



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
    const userResult = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
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
    const existingOpen = await db
      .select({
        id: verificationRequests.id,
        status: verificationRequests.status,
        submittedAt: verificationRequests.submittedAt
      })
      .from(verificationRequests)
      .where(
        and(
          eq(verificationRequests.userId, userId),
          or(
            eq(verificationRequests.status, 'pending'),
            eq(verificationRequests.status, 'under_review')
          )
        )
      )
      .orderBy(verificationRequests.submittedAt)
      .limit(1);

    if (existingOpen.length > 0) {
      console.log('ℹ️ Existing open verification request found, returning existing ID:', existingOpen[0].id);
      // Ensure user_verification reflects under_review state
      await db
        .update(userVerification)
        .set({
          verificationStatus: 'under_review',
          verificationSubmitted: true,
          updatedAt: new Date()
        })
        .where(eq(userVerification.userId, userId));
      return NextResponse.json({
        success: true,
        message: 'Verification request already submitted',
        requestId: existingOpen[0].id,
        existing: true
      });
    }

    // Insert verification request into database
    console.log('🔄 Inserting verification request...');
    const result = await db
      .insert(verificationRequests)
      .values({
        userId,
        userEmail,
        userName,
        userType,
        accountType,
        requestType,
        status,
        submittedAt: new Date(submittedAt),
        verificationDocuments: verificationDocuments ? JSON.stringify(verificationDocuments) : null,
        businessInfo: businessInfo ? JSON.stringify(businessInfo) : null,
        phoneVerified,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({ id: verificationRequests.id });
    console.log('✅ Verification request inserted with ID:', result[0].id);

    // Update user's verification status in user_verification table
    console.log('🔄 Updating user verification status...');
    await db
      .update(userVerification)
      .set({
        verificationStatus: 'under_review',
        verificationSubmitted: true,
        updatedAt: new Date()
      })
      .where(eq(userVerification.userId, userId));
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
