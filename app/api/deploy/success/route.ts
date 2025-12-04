import { NextRequest, NextResponse } from 'next/server';
import { handleDeploySuccess } from '@/lib/actions/deploy';

/**
 * POST /api/deploy/success
 * Webhook endpoint for successful deployments from worker
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Validate required fields
    if (!payload.userId || !payload.functionId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId or functionId' },
        { status: 400 }
      );
    }

    const result = await handleDeploySuccess(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error processing deploy success webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process deploy success webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
