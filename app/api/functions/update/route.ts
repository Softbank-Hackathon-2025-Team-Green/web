import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(client);

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { functionId, userId, name, description, runtime, httpRoute, environmentVariables, updatedAt } = body;

    if (!functionId || !userId) {
      return NextResponse.json({ error: 'Function ID and User ID are required' }, { status: 400 });
    }

    const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;
    if (!tableName) {
      return NextResponse.json({ error: 'DynamoDB table not configured' }, { status: 500 });
    }

    // Update in DynamoDB
    const command = new UpdateCommand({
      TableName: tableName,
      Key: { userId, functionId },
      UpdateExpression: 'SET #name = :name, description = :description, runtime = :runtime, httpRoute = :httpRoute, environmentVariables = :environmentVariables, updatedAt = :updatedAt, #status = :status',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':description': description,
        ':runtime': runtime,
        ':httpRoute': httpRoute,
        ':environmentVariables': environmentVariables || [],
        ':updatedAt': updatedAt || new Date().toISOString(),
        ':status': 'not-deployed',
      },
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    console.log('Function updated in DynamoDB:', functionId);

    return NextResponse.json({ success: true, message: 'Function updated', data: response.Attributes });
  } catch (error) {
    console.error('Error updating function:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update function' },
      { status: 500 }
    );
  }
}
