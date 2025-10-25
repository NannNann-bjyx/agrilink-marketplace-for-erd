import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { checkEmailVerification } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import { uploadBase64Image } from '@/lib/file-upload';



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
      phoneVerified = false,
      // Business details (if provided)
      businessName,
      businessDescription,
      businessLicenseNumber,
      businessHours,
      specialties,
      policies
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

    // Process verification documents - upload to filesystem and get file paths
    let processedVerificationDocuments = null;
    if (verificationDocuments) {
      console.log('📁 Processing verification documents for file upload...');
      try {
        const uploadedDocs: any = {};
        
        // Process ID Card document
        if (verificationDocuments.idCard?.data) {
          console.log('📄 Processing ID card document...');
          
          // Check if it's already an S3 key (doesn't start with 'data:')
          if (!verificationDocuments.idCard.data.startsWith('data:')) {
            console.log('📄 ID card is already an S3 key, using as-is');
            uploadedDocs.idCard = {
              ...verificationDocuments.idCard,
              // Keep the S3 key as-is
            };
          } else {
            console.log('📄 ID card is base64 data, uploading to S3...');
            const idCardFile = await uploadBase64Image(
              verificationDocuments.idCard.data,
              'verification',
              verificationDocuments.idCard.name || 'id-card'
            );
            uploadedDocs.idCard = {
              ...verificationDocuments.idCard,
              data: idCardFile.filepath, // Replace base64 with S3 key
              filename: idCardFile.filename,
              originalName: idCardFile.originalName,
              size: idCardFile.size,
              mimeType: idCardFile.mimeType
            };
          }
        }
        
        // Process Business License document
        if (verificationDocuments.businessLicense?.data) {
          console.log('📄 Processing business license document...');
          
          // Check if it's already an S3 key (doesn't start with 'data:')
          if (!verificationDocuments.businessLicense.data.startsWith('data:')) {
            console.log('📄 Business license is already an S3 key, using as-is');
            uploadedDocs.businessLicense = {
              ...verificationDocuments.businessLicense,
              // Keep the S3 key as-is
            };
          } else {
            console.log('📄 Business license is base64 data, uploading to S3...');
            const businessLicenseFile = await uploadBase64Image(
              verificationDocuments.businessLicense.data,
              'verification',
              verificationDocuments.businessLicense.name || 'business-license'
            );
            uploadedDocs.businessLicense = {
              ...verificationDocuments.businessLicense,
              data: businessLicenseFile.filepath, // Replace base64 with S3 key
              filename: businessLicenseFile.filename,
              originalName: businessLicenseFile.originalName,
              size: businessLicenseFile.size,
              mimeType: businessLicenseFile.mimeType
            };
          }
        }
        
        // Process Farm Certification document (if exists)
        if (verificationDocuments.farmCertification?.data) {
          console.log('📄 Processing farm certification document...');
          
          // Check if it's already an S3 key (doesn't start with 'data:')
          if (!verificationDocuments.farmCertification.data.startsWith('data:')) {
            console.log('📄 Farm certification is already an S3 key, using as-is');
            uploadedDocs.farmCertification = {
              ...verificationDocuments.farmCertification,
              // Keep the S3 key as-is
            };
          } else {
            console.log('📄 Farm certification is base64 data, uploading to S3...');
            const farmCertFile = await uploadBase64Image(
              verificationDocuments.farmCertification.data,
              'verification',
              verificationDocuments.farmCertification.name || 'farm-certification'
            );
            uploadedDocs.farmCertification = {
              ...verificationDocuments.farmCertification,
              data: farmCertFile.filepath, // Replace base64 with S3 key
              filename: farmCertFile.filename,
              originalName: farmCertFile.originalName,
              size: farmCertFile.size,
              mimeType: farmCertFile.mimeType
            };
          }
        }
        
        processedVerificationDocuments = uploadedDocs;
        console.log('✅ Verification documents uploaded successfully');
      } catch (uploadError) {
        console.error('❌ Failed to upload verification documents:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload verification documents', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' },
          { status: 500 }
        );
      }
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
        ${processedVerificationDocuments ? JSON.stringify(processedVerificationDocuments) : null},
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
        "verificationDocuments" = ${processedVerificationDocuments ? JSON.stringify(processedVerificationDocuments) : null},
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
    console.log('✅ User verification status updated');

    // Handle business details if provided
    if (businessName || businessDescription || businessLicenseNumber || businessHours || specialties || policies) {
      console.log('🔄 Handling business details...');
      
      // Check if business details already exist for this user
      const existingBusiness = await sql`
        SELECT id FROM business_details WHERE "userId" = ${userId} LIMIT 1
      `;

      if (existingBusiness.length > 0) {
        // Update existing business details
        console.log('🔄 Updating existing business details...');
        await sql`
          UPDATE business_details 
          SET 
            "businessName" = ${businessName || null},
            "businessDescription" = ${businessDescription || null},
            "businessLicenseNumber" = ${businessLicenseNumber || null},
            "businessHours" = ${businessHours || null},
            "specialties" = ${specialties || null},
            "policies" = ${policies ? JSON.stringify(policies) : null},
            "updatedAt" = NOW()
          WHERE "userId" = ${userId}
        `;
        console.log('✅ Business details updated');
      } else {
        // Insert new business details
        console.log('🔄 Inserting new business details...');
        await sql`
          INSERT INTO business_details (
            "userId",
            "businessName",
            "businessDescription",
            "businessLicenseNumber",
            "businessHours",
            "specialties",
            "policies",
            "createdAt",
            "updatedAt"
          ) VALUES (
            ${userId},
            ${businessName || null},
            ${businessDescription || null},
            ${businessLicenseNumber || null},
            ${businessHours || null},
            ${specialties || null},
            ${policies ? JSON.stringify(policies) : null},
            NOW(),
            NOW()
          )
        `;
        console.log('✅ Business details inserted');
      }
    }

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
