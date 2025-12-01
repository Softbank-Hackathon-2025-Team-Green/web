import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(request: NextRequest) {
  try {
    const { item } = await request.json();
    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;

    if (!tableName) {
      return NextResponse.json(
        { error: 'DynamoDB table name not configured' },
        { status: 500 }
      );
    }

    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await docClient.send(command);

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error putting item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
