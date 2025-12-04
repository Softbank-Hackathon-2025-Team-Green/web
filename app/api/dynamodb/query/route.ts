import { NextRequest, NextResponse } from 'next/server';
import { queryItems } from '@/lib/actions/dynamodb';

export async function POST(request: NextRequest) {
  try {
    const { keyConditionExpression, expressionAttributeValues, expressionAttributeNames } = await request.json();

    const result = await queryItems(
      keyConditionExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error querying items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
