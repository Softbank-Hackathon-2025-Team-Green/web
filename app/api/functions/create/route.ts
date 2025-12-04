import { NextRequest, NextResponse } from 'next/server';
import { FunctionMetadata } from '@/types/function';
import { createFunction } from '@/lib/actions/functions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const functionData: FunctionMetadata = body;

    const result = await createFunction(functionData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create function' },
      { status: 400 }
    );
  }
}
