export interface LambdaTestResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

/**
 * Invoke a Lambda function directly with IAM credentials or via API Gateway
 */
export async function invokeLambdaFunction(
  functionName: string,
  payload?: Record<string, unknown>,
  useIAM: boolean = true
): Promise<LambdaTestResult> {
  try {
    const response = await fetch('/api/lambda/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ functionName, payload, useIAM }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to invoke Lambda function',
        error: result.error,
      };
    }

    // Check for Lambda function errors
    if (result.functionError) {
      return {
        success: false,
        message: 'Lambda function returned an error',
        data: result,
        error: result.functionError,
      };
    }

    return {
      success: true,
      message: useIAM 
        ? 'Lambda function invoked successfully with IAM' 
        : 'Lambda function invoked successfully via API Gateway',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to invoke Lambda function',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test API Gateway endpoint
 */
export async function testApiGateway(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<LambdaTestResult> {
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, options);
    const result = await response.json();

    return {
      success: response.ok,
      message: response.ok ? 'API Gateway endpoint responded successfully' : 'API Gateway request failed',
      data: {
        status: response.status,
        statusText: response.statusText,
        body: result,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to call API Gateway endpoint',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
