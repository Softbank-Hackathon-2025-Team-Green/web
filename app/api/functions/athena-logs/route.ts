import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';
import { fetchFunctionLogs } from '@/lib/actions/logs';

/**
 * GET /api/functions/athena-logs?functionId=xxx
 * Fetch function execution logs from Athena
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const functionId = searchParams.get('functionId');

    if (!functionId) {
      return NextResponse.json(
        { error: 'Function ID is required' },
        { status: 400 }
      );
    }

    const result = await fetchFunctionLogs(functionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: result.requests || [],
    });
  } catch (error) {
    console.error('Error in athena-logs route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
