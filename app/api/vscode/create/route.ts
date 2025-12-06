import { NextRequest, NextResponse } from 'next/server';
import { createFile } from '@/lib/actions/vscode';
import { requireAuth } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const userId = await requireAuth();
  
  try {
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
    console.error('Error creating file/folder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
