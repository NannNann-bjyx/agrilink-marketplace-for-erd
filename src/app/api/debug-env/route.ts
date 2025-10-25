import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
      AWS_REGION: process.env.AWS_REGION,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    };
    
    console.log('🔍 Environment variables check:', envVars);
    
    return NextResponse.json({
      success: true,
      environment: envVars,
      message: 'Environment variables debug info'
    });
  } catch (error: any) {
    console.error('❌ Environment debug failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Environment debug failed',
      error: error.message
    }, { status: 500 });
  }
}
