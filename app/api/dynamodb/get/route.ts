import { NextRequest, NextResponse } from 'next/server';
import { getItem } from '@/lib/actions/dynamodb';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    const item = await getItem(key);
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error getting item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
