import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Function ID is required' }, { status: 400 });
    }

    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;
    if (!tableName) {
      return NextResponse.json({ error: 'DynamoDB table not configured' }, { status: 500 });
    }

    // Fetch from DynamoDB
    const command = new GetCommand({
      TableName: tableName,
      Key: { userId, id },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json({ error: 'Function not found' }, { status: 404 });
    }

    return NextResponse.json(response.Item);
  } catch (error) {
    console.error('Error getting function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get function' },
      { status: 500 }
    );
  }
}
