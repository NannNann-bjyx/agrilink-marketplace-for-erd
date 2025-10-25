import { NextRequest, NextResponse } from 'next/server';
import { s3UploadService } from '@/lib/s3-upload';

export async function POST(request: NextRequest) {
  try {
    const { s3Key, expiresIn = 3600 } = await request.json();
    
    if (!s3Key) {
      return NextResponse.json({
        success: false,
        message: 'S3 key is required'
      }, { status: 400 });
    }

    console.log('🔗 Generating presigned URL for:', s3Key);
    
    const presignedUrl = await s3UploadService.generatePresignedUrl(s3Key, expiresIn);
    
    return NextResponse.json({
      success: true,
      presignedUrl,
      s3Key,
      expiresIn
    });
  } catch (error) {
    console.error('❌ Presigned URL generation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate presigned URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
