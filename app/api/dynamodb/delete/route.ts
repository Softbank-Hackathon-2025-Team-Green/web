import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();
    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;

    if (!tableName) {
      return NextResponse.json(
        { error: 'DynamoDB table name not configured' },
        { status: 500 }
      );
    }

    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });

    await docClient.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
