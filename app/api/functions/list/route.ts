import { NextResponse } from 'next/server';
import { listFunctions } from '@/lib/actions/functions';
import { requireAuth } from '@/lib/auth-server';

export async function GET() {
  const userId = await requireAuth();
  
  try {
    const functions = await listFunctions(userId);
    return NextResponse.json(functions);
  } catch (error) {
    console.error('Error listing functions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list functions' },
      { status: 500 }
    );
  }
}
