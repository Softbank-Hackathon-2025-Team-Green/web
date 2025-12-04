'use server';

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth } from '@/lib/auth-server';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

const getBucketName = () => {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
  if (!bucket) {
    throw new Error('S3 bucket name not configured');
  }
  return bucket;
};

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: Date;
}

export async function listFiles(path: string, userId?: string): Promise<FileSystemItem[]> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const bucket = getBucketName();

    const prefix = path 
      ? `users/${effectiveUserId}/functions/${path}/`
      : `users/${effectiveUserId}/functions/`;

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    const allItems: FileSystemItem[] = [];
    const folderPaths = new Set<string>();

    // Process files
    (response.Contents || [])
      .filter(item => item.Key !== prefix && !item.Key?.endsWith('/'))
      .forEach(item => {
        const relativePath = item.Key?.replace(prefix, '') || '';
        
        // Add file
        allItems.push({
          name: relativePath.split('/').pop() || relativePath,
          path: relativePath,
          type: 'file',
          size: item.Size,
          lastModified: item.LastModified,
        });

        // Track parent folders
        const pathParts = relativePath.split('/');
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderPath = pathParts.slice(0, i + 1).join('/');
          if (folderPath) {
            folderPaths.add(folderPath);
          }
        }
      });

    // Add folders
    folderPaths.forEach(folderPath => {
      const folderName = folderPath.split('/').pop() || folderPath;
      allItems.push({
        name: folderName,
        path: folderPath,
        type: 'folder',
      });
    });

    // Sort: folders first, then files
    allItems.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return allItems;
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to list files');
  }
}

export async function readFile(path: string, userId?: string): Promise<string> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const bucket = getBucketName();
    const key = `users/${effectiveUserId}/functions/${path}`;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const content = await response.Body?.transformToString() || '';
    
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to read file');
  }
}

export async function writeFile(path: string, content: string, userId?: string): Promise<{ success: boolean }> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const bucket = getBucketName();
    const key = `users/${effectiveUserId}/functions/${path}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
    });

    await s3Client.send(command);
    console.log('File written to S3:', key);

    return { success: true };
  } catch (error) {
    console.error('Error writing file:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to write file');
  }
}

export async function createFile(path: string, isDirectory: boolean, userId?: string): Promise<{ success: boolean }> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const bucket = getBucketName();
    const key = isDirectory
      ? `users/${effectiveUserId}/functions/${path}/`
      : `users/${effectiveUserId}/functions/${path}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: isDirectory ? '' : '',
      ContentType: 'text/plain',
    });

    await s3Client.send(command);
    console.log('File/Directory created in S3:', key);

    return { success: true };
  } catch (error) {
    console.error('Error creating file:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create file');
  }
}

export async function deleteFile(path: string, userId?: string): Promise<{ success: boolean }> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const bucket = getBucketName();

    // Check if it's a directory by listing contents
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `users/${effectiveUserId}/functions/${path}`,
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    if (objects.length === 0) {
      return { success: true };
    }

    // Delete all objects
    if (objects.length === 1) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: objects[0].Key,
      });
      await s3Client.send(deleteCommand);
    } else {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: objects.map(obj => ({ Key: obj.Key })),
        },
      });
      await s3Client.send(deleteCommand);
    }

    console.log('File(s) deleted from S3:', path);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete file');
  }
}

export async function getUploadUrl(path: string, userId?: string): Promise<{ url: string; key: string }> {
  try {
    const effectiveUserId = userId || await requireAuth();
    const bucket = getBucketName();
    const key = `users/${effectiveUserId}/functions/${path}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { url, key };
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get upload URL');
  }
}
