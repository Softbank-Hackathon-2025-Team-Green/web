import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nodes, edges, viewport } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const tableName = process.env.DYNAMODB_WORKSPACE_TABLE || 'sbht-user-progress';

    // Save workspace state to DynamoDB
    const command = new PutCommand({
      TableName: tableName,
      Item: {
        userId,
        nodes: nodes || [],
        edges: edges || [],
        viewport: viewport || { x: 0, y: 0, zoom: 1 },
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    console.log('Workspace saved:', userId);

    return NextResponse.json({ success: true, message: 'Workspace saved' });
  } catch (error) {
    console.error('Error saving workspace:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save workspace' },
      { status: 500 }
    );
  }
}
