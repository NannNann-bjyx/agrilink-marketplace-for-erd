import { NextRequest, NextResponse } from 'next/server';
import { twilioService } from '@/lib/twilio-service';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Send verification code using Twilio service
    console.log('🔍 API: About to call twilioService.sendVerificationCode', {
      userId,
      phoneNumber
    });
    
    const result = await twilioService.sendVerificationCode(userId, phoneNumber);
    
    console.log('🔍 API: twilioService result:', result);
    
    if (!result.success) {
      const errorMessage = result.error || result.message || 'Failed to send verification code';
      console.error('❌ API: Twilio service failed:', errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { 
          status: errorMessage.includes('wait a minute') ? 429 : 400 
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Verification code sent successfully',
      verificationId: result.verificationId
    });

  } catch (error: any) {
    console.error('Error sending verification SMS:', error);
    
    // Return proper JSON error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to send verification SMS';
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
