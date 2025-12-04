import { NextRequest, NextResponse } from 'next/server';
import { putItem } from '@/lib/actions/dynamodb';

export async function POST(request: NextRequest) {
  try {
    const { item } = await request.json();

    await putItem(item);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error putting item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
