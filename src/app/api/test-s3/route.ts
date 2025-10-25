import { NextRequest, NextResponse } from 'next/server';
import { s3UploadService } from '@/lib/s3-upload';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing S3 connection...');
    
    // Test S3 connection
    const isConnected = await s3UploadService.testConnection();
    
    if (isConnected) {
      console.log('✅ S3 connection test successful');
      return NextResponse.json({
        success: true,
        message: 'S3 connection successful',
        bucket: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        mode: 'production'
      });
    } else {
      console.log('❌ S3 connection test failed');
      return NextResponse.json({
        success: false,
        message: 'S3 connection failed',
        bucket: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        mode: 'development'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ S3 test error:', error);
    return NextResponse.json({
      success: false,
      message: 'S3 test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: 'development'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const config = {
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      mode: process.env.AWS_ACCESS_KEY_ID ? 'production' : 'development'
    };
    
    console.log('🔍 S3 Configuration:', config);
    
    return NextResponse.json({
      success: true,
      config,
      message: config.hasCredentials ? 'S3 configured for production' : 'S3 running in development mode'
    });
  } catch (error) {
    console.error('❌ S3 config error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get S3 configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
