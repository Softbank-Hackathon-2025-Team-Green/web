import { NextRequest, NextResponse } from 'next/server';
import { listFiles } from '@/lib/actions/vscode';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    
    const { path } = await request.json();

    const items = await listFiles(path || '', userId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
