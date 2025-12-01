export interface DynamoDBTestResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

/**
 * Create/Put an item in DynamoDB
 */
export async function putDynamoDBItem(item: Record<string, unknown>): Promise<DynamoDBTestResult> {
  try {
    const response = await fetch('/api/dynamodb/put', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to put item',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Item created successfully',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to put item',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get an item from DynamoDB
 */
export async function getDynamoDBItem(key: Record<string, unknown>): Promise<DynamoDBTestResult> {
  try {
    const response = await fetch('/api/dynamodb/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to get item',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Item retrieved successfully',
      data: result.item,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get item',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Query items from DynamoDB
 */
export async function queryDynamoDBItems(params: {
  keyConditionExpression: string;
  expressionAttributeValues: Record<string, unknown>;
}): Promise<DynamoDBTestResult> {
  try {
    const response = await fetch('/api/dynamodb/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to query items',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Items queried successfully',
      data: result.items,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to query items',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Scan items from DynamoDB
 */
export async function scanDynamoDBItems(limit?: number): Promise<DynamoDBTestResult> {
  try {
    const response = await fetch(`/api/dynamodb/scan?limit=${limit || 10}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to scan items',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Items scanned successfully',
      data: result.items,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to scan items',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete an item from DynamoDB
 */
export async function deleteDynamoDBItem(key: Record<string, unknown>): Promise<DynamoDBTestResult> {
  try {
    const response = await fetch('/api/dynamodb/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to delete item',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Item deleted successfully',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete item',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
