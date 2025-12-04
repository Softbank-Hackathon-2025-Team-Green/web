import { NextRequest, NextResponse } from 'next/server';
import { deleteItem } from '@/lib/actions/dynamodb';

export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();

    await deleteItem(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
