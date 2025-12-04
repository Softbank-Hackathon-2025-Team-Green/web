import { NextRequest, NextResponse } from 'next/server';
import { scanItems } from '@/lib/actions/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await scanItems(limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error scanning items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
