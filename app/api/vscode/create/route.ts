import { NextRequest, NextResponse } from 'next/server';
import { createFile } from '@/lib/actions/vscode';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    
    const { path, isDirectory } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: 'Path not provided' },
        { status: 400 }
      );
    }

    await createFile(path, isDirectory || false, userId);

    return NextResponse.json({
      success: true,
      path,
      type: isDirectory ? 'folder' : 'file',
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    console.error('Error creating file/folder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
