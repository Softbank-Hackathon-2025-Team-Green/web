import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;

    if (!tableName) {
      return NextResponse.json(
        { error: 'DynamoDB table name not configured' },
        { status: 500 }
      );
    }

    const command = new ScanCommand({
      TableName: tableName,
      Limit: limit,
    });

    const response = await docClient.send(command);

    return NextResponse.json({ 
      items: response.Items || [],
      count: response.Count,
      scannedCount: response.ScannedCount,
    });
  } catch (error) {
    console.error('Error scanning items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
