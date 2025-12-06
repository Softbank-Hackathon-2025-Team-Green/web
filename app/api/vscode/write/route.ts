import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from '@/lib/actions/vscode';
import { requireAuth, TokenExpiredError } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    
    const { path, content } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: 'File path not provided' },
        { status: 400 }
      );
    }

    await writeFile(path, content || '', userId);

    return NextResponse.json({
      success: true,
      path,
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    console.error('Error writing file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
