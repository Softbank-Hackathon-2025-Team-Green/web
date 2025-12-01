import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(request: NextRequest) {
  try {
    const { keyConditionExpression, expressionAttributeValues } = await request.json();
    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;

    if (!tableName) {
      return NextResponse.json(
        { error: 'DynamoDB table name not configured' },
        { status: 500 }
      );
    }

    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const response = await docClient.send(command);

    return NextResponse.json({ 
      items: response.Items || [],
      count: response.Count,
    });
  } catch (error) {
    console.error('Error querying items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
