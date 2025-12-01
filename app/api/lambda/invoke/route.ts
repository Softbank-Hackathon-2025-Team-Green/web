import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { NextRequest, NextResponse } from 'next/server';

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { functionName, payload, useIAM } = await request.json();

    // Option 1: Direct Lambda invocation with IAM credentials (recommended for secured functions)
    if (useIAM) {
      if (!functionName) {
        return NextResponse.json(
          { error: 'Function name not provided' },
          { status: 400 }
        );
      }

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

      return NextResponse.json({
        statusCode: response.StatusCode || 200,
        executedVersion: response.ExecutedVersion,
        body: responsePayload,
        functionError: response.FunctionError,
      });
    }

    // Option 2: API Gateway endpoint (for publicly accessible or API Gateway secured functions)
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;

    if (!apiEndpoint) {
      return NextResponse.json(
        { error: 'API endpoint not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiEndpoint}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    const data = await response.json();

    console.log(data);

    return NextResponse.json({
      statusCode: response.status,
      body: data,
    });
  } catch (error) {
    console.error('Error invoking Lambda:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
