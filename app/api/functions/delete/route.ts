import { NextRequest, NextResponse } from 'next/server';
import { deleteFunction } from '@/lib/actions/functions';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth();
    
    const body = await request.json();
    const { functionId } = body;

    if (!functionId) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    await deleteFunction(functionId, userId);
    console.log('Function deleted:', functionId);

    return NextResponse.json({ success: true, message: 'Function deleted' });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    console.error('Error deleting function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete function' },
      { status: 500 }
    );
  }
}
