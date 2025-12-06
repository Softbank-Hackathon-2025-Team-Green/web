import { NextResponse } from 'next/server';
import { loadWorkspace } from '@/lib/actions/workspace';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';

export async function GET() {
  try {
    const userId = await requireAuth();
    
    const workspace = await loadWorkspace(userId);
    return NextResponse.json(workspace);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    console.error('Error loading workspace:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load workspace' },
      { status: 500 }
    );
  }
}
