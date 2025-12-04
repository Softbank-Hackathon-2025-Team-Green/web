/**
 * DynamoDB Service Layer
 * Business logic and error handling for DynamoDB operations
 */
'use server';

import * as dynamoDBUtils from '../dynamodb-utils';

export async function scanItems(limit: number = 10): Promise<{
  items: unknown[];
  count?: number;
  scannedCount?: number;
}> {
  try {
    return await dynamoDBUtils.scanItems(limit);
  } catch (error) {
    console.error('Error scanning items:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to scan items');
  }
}

export async function getItem(key: Record<string, unknown>): Promise<unknown | null> {
  try {
    return await dynamoDBUtils.getItem(key);
  } catch (error) {
    console.error('Error getting item:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get item');
  }
}

export async function putItem(item: Record<string, unknown>): Promise<{ success: boolean }> {
  try {
    return await dynamoDBUtils.putItem(item);
  } catch (error) {
    console.error('Error putting item:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to put item');
  }
}

export async function deleteItem(key: Record<string, unknown>): Promise<{ success: boolean }> {
  try {
    return await dynamoDBUtils.deleteItem(key);
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
    return await dynamoDBUtils.queryItems(
      keyConditionExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );
  } catch (error) {
    console.error('Error querying items:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to query items');
  }
}
