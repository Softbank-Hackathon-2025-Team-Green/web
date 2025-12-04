/**
 * DynamoDB AWS SDK wrapper functions (Library Layer)
 * Lowest level - Direct AWS SDK calls
 */

import { 
  ScanCommand, 
  GetCommand, 
  PutCommand, 
  DeleteCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import { getDynamoDBDocClient, getDynamoDBTableName } from './aws-clients';

/**
 * Scan items from DynamoDB table
 */
export async function scanItems(limit: number = 10): Promise<{
  items: unknown[];
  count?: number;
  scannedCount?: number;
}> {
  const docClient = getDynamoDBDocClient();
  const tableName = getDynamoDBTableName();

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
}

/**
 * Get a single item from DynamoDB table
 */
export async function getItem(key: Record<string, unknown>): Promise<unknown | null> {
  const docClient = getDynamoDBDocClient();
  const tableName = getDynamoDBTableName();

  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });

  const response = await docClient.send(command);
  return response.Item || null;
}

/**
 * Put an item into DynamoDB table
 */
export async function putItem(item: Record<string, unknown>): Promise<{ success: boolean }> {
  const docClient = getDynamoDBDocClient();
  const tableName = getDynamoDBTableName();

  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await docClient.send(command);
  return { success: true };
}

/**
 * Delete an item from DynamoDB table
 */
export async function deleteItem(key: Record<string, unknown>): Promise<{ success: boolean }> {
  const docClient = getDynamoDBDocClient();
  const tableName = getDynamoDBTableName();

  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });

  await docClient.send(command);
  return { success: true };
}

/**
 * Query items from DynamoDB table
 */
export async function queryItems(
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>
): Promise<{ items: unknown[]; count?: number }> {
  const docClient = getDynamoDBDocClient();
  const tableName = getDynamoDBTableName();

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
}
