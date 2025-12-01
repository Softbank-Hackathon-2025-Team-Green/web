import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'test-user-123';

    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;
    if (!tableName) {
      return NextResponse.json({ error: 'DynamoDB table not configured' }, { status: 500 });
    }

    // Scan DynamoDB table for all functions
    // In production, you might want to add a userId filter or use a GSI
    const command = new ScanCommand({
      TableName: tableName,
    });

    const response = await docClient.send(command);
    const functions = response.Items || [];
    
    return NextResponse.json(functions);
  } catch (error) {
    console.error('Error listing functions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list functions' },
      { status: 500 }
    );
  }
}
