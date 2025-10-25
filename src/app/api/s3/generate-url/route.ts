import { NextRequest, NextResponse } from "next/server";
import { s3UploadService } from '@/lib/s3-upload';

export async function POST(request: NextRequest) {
  try {
    const { s3Key } = await request.json();
    
    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }
    
    console.log('🔗 Generating fresh presigned URL for:', s3Key);
    
    // Generate a fresh presigned URL (7 days)
    const presignedUrl = await s3UploadService.generatePresignedUrl(s3Key, 604800);
    
    console.log('✅ Fresh presigned URL generated:', s3Key);
    
    return NextResponse.json({
      success: true,
      presignedUrl,
      s3Key,
      expiresIn: 604800
    });
    
  } catch (error) {
    console.error('❌ Failed to generate presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
