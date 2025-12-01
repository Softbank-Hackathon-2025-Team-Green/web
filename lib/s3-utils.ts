export interface S3TestResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

/**
 * Upload a file to S3 via API route
 */
export async function uploadFileToS3(
  file: File,
  key?: string
): Promise<S3TestResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (key) {
      formData.append('key', key);
    }

    const response = await fetch('/api/s3/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to upload file',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      data: { key: result.key, url: result.url },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a presigned URL for an S3 object via API route
 */
export async function getS3FileUrl(key: string): Promise<S3TestResult> {
  try {
    const response = await fetch('/api/s3/get-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to get file URL',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'URL retrieved successfully',
      data: { url: result.url, key: result.key },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get file URL',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List files in S3 via API route
 */
export async function listS3Files(prefix?: string): Promise<S3TestResult> {
  try {
    const url = new URL('/api/s3/list', window.location.origin);
    if (prefix) {
      url.searchParams.set('prefix', prefix);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to list files',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Files listed successfully',
      data: { items: result.items },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to list files',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a file from S3 via API route
 */
export async function deleteS3File(key: string): Promise<S3TestResult> {
  try {
    const response = await fetch('/api/s3/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to delete file',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'File deleted successfully',
      data: { key: result.key },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
