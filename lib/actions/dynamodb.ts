'use server';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  GetCommand, 
  PutCommand, 
  DeleteCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const getTableName = () => {
  const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error('DynamoDB table name not configured');
  }
  return tableName;
};

export async function scanItems(limit: number = 10): Promise<{
  items: unknown[];
  count?: number;
  scannedCount?: number;
}> {
  try {
    const tableName = getTableName();

    const command = new ScanCommand({
      TableName: tableName,
      Limit: limit,
    });

    const response = await docClient.send(command);

    return {
      items: response.Items || [],
      count: response.Count,
      scannedCount: response.ScannedCount,
    };
  } catch (error) {
    console.error('Error scanning items:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to scan items');
  }
}

export async function getItem(key: Record<string, unknown>): Promise<unknown | null> {
  try {
    const tableName = getTableName();

    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });

    const response = await docClient.send(command);
    return response.Item || null;
  } catch (error) {
    console.error('Error getting item:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get item');
  }
}

export async function putItem(item: Record<string, unknown>): Promise<{ success: boolean }> {
  try {
    const tableName = getTableName();

    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error putting item:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to put item');
  }
}

export async function deleteItem(key: Record<string, unknown>): Promise<{ success: boolean }> {
  try {
    const tableName = getTableName();

    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });

    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error deleting item:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete item');
  }
}

export async function queryItems(
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>
): Promise<{ items: unknown[]; count?: number }> {
  try {
    const tableName = getTableName();

    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    });

    const response = await docClient.send(command);

    return {
      items: response.Items || [],
      count: response.Count,
    };
  } catch (error) {
    console.error('Error querying items:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to query items');
  }
}
