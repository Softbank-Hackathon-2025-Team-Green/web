import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/actions/vscode';
import { requireAuth } from '@/lib/auth-server';

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: 'File path not provided' },
        { status: 400 }
      );
    }

    await deleteFile(path, userId);

    return NextResponse.json({
      success: true,
      path,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
