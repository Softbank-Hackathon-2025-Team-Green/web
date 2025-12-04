'use server';

import { getLambdaClient } from '@/lib/aws-clients';
import { InvokeCommand } from '@aws-sdk/client-lambda';

export interface LambdaInvokeParams {
  functionName: string;
  payload?: Record<string, unknown>;
  useIAM: boolean;
}

export interface LambdaInvokeResult {
  success: boolean;
  statusCode?: number;
  body?: unknown;
  executedVersion?: string;
  functionError?: string;
  error?: string;
}

/**
 * Invoke Lambda function with IAM credentials (direct SDK call)
 */
async function invokeLambdaWithIAM(
  functionName: string,
  payload?: Record<string, unknown>
): Promise<LambdaInvokeResult> {
  try {
    const lambdaClient = getLambdaClient();

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload || {}),
      InvocationType: 'RequestResponse', // Synchronous invocation
    });

    const response = await lambdaClient.send(command);

    // Decode the response payload
    const responsePayload = response.Payload
      ? JSON.parse(new TextDecoder().decode(response.Payload))
      : null;

    return {
      success: true,
      statusCode: response.StatusCode || 200,
      executedVersion: response.ExecutedVersion,
      body: responsePayload,
      functionError: response.FunctionError,
    };
  } catch (error) {
    console.error('Lambda IAM invocation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Invoke Lambda function via API Gateway endpoint
 */
async function invokeLambdaViaAPIGateway(
  functionName: string,
  payload?: Record<string, unknown>
): Promise<LambdaInvokeResult> {
  try {
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;

    if (!apiEndpoint) {
      return { success: false, error: 'API endpoint not configured' };
    }

    const response = await fetch(`${apiEndpoint}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    const data = await response.json();

    return {
      success: response.ok,
      statusCode: response.status,
      body: data,
    };
  } catch (error) {
    console.error('Lambda API Gateway invocation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Main service function to invoke Lambda
 * Routes between IAM and API Gateway based on useIAM flag
 */
export async function invokeLambda(
  params: LambdaInvokeParams
): Promise<LambdaInvokeResult> {
  const { functionName, payload, useIAM } = params;

  if (!functionName) {
    return { success: false, error: 'Function name is required' };
  }

  if (useIAM) {
    return invokeLambdaWithIAM(functionName, payload);
  } else {
    if (!process.env.NEXT_PUBLIC_API_ENDPOINT) {
      return { success: false, error: 'API endpoint not configured' };
    }
    return invokeLambdaViaAPIGateway(functionName, payload);
  }
}
