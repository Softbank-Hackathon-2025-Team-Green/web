import { NextResponse } from 'next/server';
import { listFunctions } from '@/lib/actions/functions';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';

export async function GET() {
  try {
    const userId = await requireAuth();
    
    const functions = await listFunctions(userId);
    return NextResponse.json(functions);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    console.error('Error listing functions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list functions' },
      { status: 500 }
    );
  }
}
