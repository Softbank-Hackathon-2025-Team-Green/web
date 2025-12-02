import { NextRequest, NextResponse } from 'next/server';
import { FunctionMetadata } from '@/types/function';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const functionData: FunctionMetadata = body;

    if (!functionData.functionId || !functionData.name || !functionData.runtime || !functionData.httpRoute) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;
    if (!tableName) {
      return NextResponse.json({ error: 'DynamoDB table not configured' }, { status: 500 });
    }

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: tableName,
      Item: functionData,
    });

    await docClient.send(command);
    console.log('Function created in DynamoDB:', functionData.functionId);

    return NextResponse.json({ functionId: functionData.functionId, success: true });
  } catch (error) {
    console.error('Error creating function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create function' },
      { status: 500 }
    );
  }
}
