'use server';

import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDBDocClient, getDynamoDBTableName } from '../aws-clients';

const SLACK_WEBHOOK_URL = process.env.NEXT_PUBLIC_AMPLIFY_SLACK_WEBHOOK || '';

/**
 * Send notification to Slack webhook
 */
async function sendSlackNotification(payload: any): Promise<void> {
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

export interface DeploySuccessPayload {
  userId: string;
  functionId: string;
  customRoutes: string[];
  message: string;
  url: string;
  timestamp: number;
}

export interface DeployFailedPayload {
  userId: string;
  functionId: string;
  customRoutes: string[];
  message: string;
  url?: string;
  timestamp: number;
}

export interface DeployResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Handle successful deployment webhook from worker
 * Updates function status and deployment URL in DynamoDB
 */
export async function handleDeploySuccess(payload: DeploySuccessPayload): Promise<DeployResult> {
  try {
    const { userId, functionId, customRoutes, message, url, timestamp } = payload;

    if (!userId || !functionId) {
      return { success: false, message: 'Missing required fields: userId or functionId' };
    }

    const docClient = getDynamoDBDocClient();
    const tableName = getDynamoDBTableName();

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { userId, functionId },
      UpdateExpression: 'SET #status = :status, deploymentUrl = :url, customRoutes = :customRoutes, lastDeployedAt = :deployedAt, updatedAt = :updatedAt, deploymentMessage = :message',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'idle',
        ':url': url,
        ':customRoutes': customRoutes,
        ':deployedAt': new Date(timestamp * 1000).toISOString(),
        ':updatedAt': new Date().toISOString(),
        ':message': message,
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    const functionData = result.Attributes;
    console.log('Deploy success processed:', { userId, functionId, url });

    // Send Slack notification
    await sendSlackNotification({
      text: `🚀 *Deployment Successful!*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚀 Deployment Successful!',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Function:*\n${functionData?.name || functionId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n✅ Deployed`,
            },
            {
              type: 'mrkdwn',
              text: `*User ID:*\n${userId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Runtime:*\n${functionData?.runtime || 'N/A'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Function URL:*\n\`${url}\``,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🔗 Open Function',
                emoji: true,
              },
              url: `${process.env.NEXT_PUBLIC_FUNCTION_CALL_BASEURL}/${userId}/${customRoutes}`,
              style: 'primary',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Deployed at <!date^${timestamp}^{date_short_pretty} {time}|${new Date(timestamp * 1000).toISOString()}>`,
            },
          ],
        },
      ],
    });

    return {
      success: true,
      message: 'Function deployment status updated successfully',
    };
  } catch (error) {
    console.error('Error handling deploy success:', error);
    return {
      success: false,
      message: 'Failed to update function deployment status',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle failed deployment webhook from worker
 * Updates function status to error and stores error message
 */
export async function handleDeployFailed(payload: DeployFailedPayload): Promise<DeployResult> {
  try {
    const { userId, functionId, message, timestamp } = payload;

    if (!userId || !functionId) {
      return { success: false, message: 'Missing required fields: userId or functionId' };
    }

    const docClient = getDynamoDBDocClient();
    const tableName = getDynamoDBTableName();

    // Get function data first
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { userId, functionId },
    });
    const { Item: functionData } = await docClient.send(getCommand);

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { userId, functionId },
      UpdateExpression: 'SET #status = :status, deploymentError = :error, lastDeployAttemptAt = :attemptedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'error',
        ':error': message,
        ':attemptedAt': new Date(timestamp * 1000).toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    await docClient.send(command);
    console.log('Deploy failure processed:', { userId, functionId, error: message });

    // Send Slack notification
    await sendSlackNotification({
      text: `❌ *Deployment Failed!*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ Deployment Failed',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Function:*\n${functionData?.name || functionId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n🔴 Failed`,
            },
            {
              type: 'mrkdwn',
              text: `*User ID:*\n${userId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Runtime:*\n${functionData?.runtime || 'N/A'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error Message:*\n\`\`\`${message}\`\`\``,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Failed at <!date^${timestamp}^{date_short_pretty} {time}|${new Date(timestamp * 1000).toISOString()}>`,
            },
          ],
        },
      ],
    });

    return {
      success: true,
      message: 'Function deployment error status updated successfully',
    };
  } catch (error) {
    console.error('Error handling deploy failure:', error);
    return {
      success: false,
      message: 'Failed to update function deployment error status',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
