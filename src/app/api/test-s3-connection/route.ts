import { NextRequest, NextResponse } from "next/server";
import { s3UploadService } from '@/lib/s3-upload';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing S3 connection...');
    console.log('🔍 Environment variables check:');
    console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
    console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
    console.log('  AWS_REGION:', process.env.AWS_REGION || 'NOT SET');
    console.log('  AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET || 'NOT SET');
    
    const isConnected = await s3UploadService.testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'S3 connection successful',
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'S3 connection failed',
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ S3 connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'S3 connection test failed',
      error: error.message,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION
    }, { status: 500 });
  }
}
