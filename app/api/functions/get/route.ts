import { NextRequest, NextResponse } from 'next/server';
import { getFunction } from '@/lib/actions/functions';
import { requireAuth } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const functionId = searchParams.get('functionId');
    
    if (!functionId) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    const functionData = await getFunction(functionId, userId);

    if (!functionData) {
      return NextResponse.json({ error: 'Function not found' }, { status: 404 });
    }

    return NextResponse.json(functionData);
  } catch (error) {
    console.error('Error getting function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get function' },
      { status: 500 }
    );
  }
}
