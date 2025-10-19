import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';



export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    const [adminUser] = await sql`
      SELECT id, email, "userType" 
      FROM users 
      WHERE id = ${decoded.userId} AND "userType" = 'admin'
    `;

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all verification requests with user profile data
    console.log('🔍 Fetching verification requests...');
    
    // Fetch verification requests with complete user and business data
    const requests = await sql`
      SELECT 
        vr.id,
        vr."userId",
        vr."userEmail",
        vr."userName",
        vr."userType",
        vr."accountType",
        vr."requestType",
        vr.status,
        vr."submittedAt",
        vr."reviewedAt",
        vr."reviewedBy",
        vr."verificationDocuments" as verification_request_documents,
        vr."businessInfo",
        vr."phoneVerified" as verification_phone_verified,
        vr."reviewNotes",
        vr."createdAt",
        vr."updatedAt",
        up.phone,
        uv."phoneVerified" as user_phone_verified,
        uv."verificationDocuments" as user_verification_documents,
        uv."rejectedDocuments" as user_rejected_documents,
        uv."businessDetailsCompleted",
        bd."businessName",
        bd."businessDescription", 
        bd."businessLicenseNumber",
        CASE 
          WHEN l.city IS NOT NULL AND l.region IS NOT NULL 
          THEN l.city || ', ' || l.region
          ELSE 'Unknown Location'
        END as location
      FROM verification_requests vr
      LEFT JOIN user_profiles up ON vr."userId" = up."userId"
      LEFT JOIN users u ON vr."userId" = u.id
      LEFT JOIN user_verification uv ON vr."userId" = uv."userId"
      LEFT JOIN business_details bd ON vr."userId" = bd."userId"
      LEFT JOIN locations l ON up."locationId" = l.id
      ORDER BY vr."submittedAt" DESC
    `;

    console.log('✅ Verification requests fetched:', requests.length);

    return NextResponse.json({ 
      success: true, 
      requests: requests || [] 
    });

  } catch (error: any) {
    console.error('❌ Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}
