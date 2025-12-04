import { NextRequest, NextResponse } from 'next/server';
import { updateFunction } from '@/lib/actions/functions';
import { requireAuth } from '@/lib/auth-server';

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { functionId, name, description, runtime, httpRoute, environmentVariables, status } = body;

    if (!functionId) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    const result = await updateFunction(
      functionId,
      { name, description, runtime, httpRoute, environmentVariables, status },
      userId
    );

    return NextResponse.json({ success: true, message: 'Function updated', data: result.data });
  } catch (error) {
    console.error('Error updating function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update function' },
      { status: 500 }
    );
  }
}
