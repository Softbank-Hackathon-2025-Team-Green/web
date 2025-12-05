'use server';

import { GetCommand, PutCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { FunctionMetadata } from '@/types/function';
import { requireAuth } from '@/lib/auth-server';
import { getDynamoDBDocClient, getDynamoDBTableName } from '../aws-clients';

const docClient = getDynamoDBDocClient();

export async function listFunctions(userId?: string): Promise<FunctionMetadata[]> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const tableName = getDynamoDBTableName();

    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': effectiveUserId,
      },
    });

    const response = await docClient.send(command);
    return (response.Items || []) as FunctionMetadata[];
  } catch (error) {
    console.error('Error listing functions:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to list functions');
  }
}

export async function getFunction(functionId: string, userId?: string): Promise<FunctionMetadata | null> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const tableName = getDynamoDBTableName();

    const command = new GetCommand({
      TableName: tableName,
      Key: { userId: effectiveUserId, functionId },
    });

    const response = await docClient.send(command);
    return response.Item ? (response.Item as FunctionMetadata) : null;
  } catch (error) {
    console.error('Error getting function:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get function');
  }
}

export async function createFunction(functionData: FunctionMetadata): Promise<{ functionId: string; success: boolean }> {
  try {
    if (!functionData.functionId || !functionData.name || !functionData.runtime) {
      throw new Error('Missing required fields');
    }

    const tableName = getDynamoDBTableName();

    const command = new PutCommand({
      TableName: tableName,
      Item: functionData,
    });

    await docClient.send(command);
    console.log('Function created in DynamoDB:', functionData.functionId);

    return { functionId: functionData.functionId, success: true };
  } catch (error) {
    console.error('Error creating function:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create function');
  }
}

export async function updateFunction(
  functionId: string,
  updates: {
    name?: string;
    description?: string;
    runtime?: string;
    httpRoute?: string;
    environmentVariables?: Array<{ key: string; value: string }>;
    status?: string;
  },
  userId?: string
): Promise<{ success: boolean; data: FunctionMetadata }> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const tableName = getDynamoDBTableName();

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = updates.name;
    }

    if (updates.description !== undefined) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = updates.description;
    }

    if (updates.runtime !== undefined) {
      updateExpressions.push('runtime = :runtime');
      expressionAttributeValues[':runtime'] = updates.runtime;
    }

    if (updates.httpRoute !== undefined) {
      updateExpressions.push('httpRoute = :httpRoute');
      expressionAttributeValues[':httpRoute'] = updates.httpRoute;
    }

    if (updates.environmentVariables !== undefined) {
      updateExpressions.push('environmentVariables = :environmentVariables');
      expressionAttributeValues[':environmentVariables'] = updates.environmentVariables;
    }

    if (updates.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updates.status;
    }

    // Always update the updatedAt timestamp
    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { userId: effectiveUserId, functionId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    console.log('Function updated in DynamoDB:', functionId);

    return { success: true, data: response.Attributes as FunctionMetadata };
  } catch (error) {
    console.error('Error updating function:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update function');
  }
}

export async function deleteFunction(functionId: string, userId?: string): Promise<{ success: boolean }> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const tableName = getDynamoDBTableName();

    const command = new DeleteCommand({
      TableName: tableName,
      Key: { userId: effectiveUserId, functionId },
    });

    await docClient.send(command);
    console.log('Function deleted from DynamoDB:', functionId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting function:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete function');
  }
}
