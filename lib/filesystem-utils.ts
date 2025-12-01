export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: Date;
}

export interface FileOperationResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

/**
 * Read file content from S3
 */
export async function readFile(path: string, userId: string): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/vscode/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, userId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to read file',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'File read successfully',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to read file',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Write file content to S3
 */
export async function writeFile(
  path: string,
  content: string,
  userId: string
): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/vscode/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, userId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to write file',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'File saved successfully',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to write file',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List files and folders in a directory
 */
export async function listDirectory(
  path: string,
  userId: string
): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/vscode/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, userId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to list directory',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Directory listed successfully',
      data: result.items,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to list directory',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(path: string, userId: string): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/vscode/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, userId }),
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
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create a new file or folder
 */
export async function createFileOrFolder(
  path: string,
  type: 'file' | 'folder',
  userId: string
): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/vscode/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, type, userId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to create ${type}`,
        error: result.error,
      };
    }

    return {
      success: true,
      message: `${type === 'file' ? 'File' : 'Folder'} created successfully`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create ${type}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get language from file extension for Monaco Editor
 */
export function getLanguageFromPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    txt: 'plaintext',
  };

  return languageMap[extension || ''] || 'plaintext';
}
