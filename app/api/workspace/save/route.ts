import { NextRequest, NextResponse } from 'next/server';
import { saveWorkspace } from '@/lib/actions/workspace';
import { requireAuth } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const userId = await requireAuth();
  
  try {
    const body = await request.json();
    const { nodes, edges, viewport } = body;

    await saveWorkspace({ nodes, edges, viewport }, userId);

    return NextResponse.json({ success: true, message: 'Workspace saved' });
  } catch (error) {
    console.error('Error saving workspace:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save workspace' },
      { status: 500 }
    );
  }
}
