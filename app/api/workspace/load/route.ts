import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_WORKSPACE_TABLE || 'sbht-user-progress';

    // Fetch workspace state from DynamoDB
    const command = new GetCommand({
      TableName: tableName,
      Key: { userId },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      // Return empty workspace if not found
      return NextResponse.json({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });
    }

    return NextResponse.json({
      nodes: response.Item.nodes || [],
      edges: response.Item.edges || [],
      viewport: response.Item.viewport || { x: 0, y: 0, zoom: 1 },
    });
  } catch (error) {
    console.error('Error loading workspace:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load workspace' },
      { status: 500 }
    );
  }
}
