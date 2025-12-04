'use server';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { type Node, type Edge } from '@xyflow/react';
import { requireAuth } from '@/lib/auth-server';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const getWorkspaceTableName = () => {
  return process.env.NEXT_PUBLIC_DYNAMODB_WORKSPACE_TABLE || 'sbht-user-progress';
};

export interface WorkspaceData {
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

export async function loadWorkspace(userId?: string): Promise<WorkspaceData> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const tableName = getWorkspaceTableName();

    const command = new GetCommand({
      TableName: tableName,
      Key: { userId: effectiveUserId },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };
    }

    return {
      nodes: response.Item.nodes || [],
      edges: response.Item.edges || [],
      viewport: response.Item.viewport || { x: 0, y: 0, zoom: 1 },
    };
  } catch (error) {
    console.error('Error loading workspace:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to load workspace');
  }
}

export async function saveWorkspace(
  workspace: WorkspaceData,
  userId?: string
): Promise<{ success: boolean }> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const tableName = getWorkspaceTableName();

    const command = new PutCommand({
      TableName: tableName,
      Item: {
        userId: effectiveUserId,
        nodes: workspace.nodes || [],
        edges: workspace.edges || [],
        viewport: workspace.viewport || { x: 0, y: 0, zoom: 1 },
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    console.log('Workspace saved:', effectiveUserId);

    return { success: true };
  } catch (error) {
    console.error('Error saving workspace:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save workspace');
  }
}
