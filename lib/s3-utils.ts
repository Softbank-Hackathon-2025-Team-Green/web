/**
 * S3 AWS SDK wrapper functions (Library Layer)
 * Lowest level - Direct AWS SDK calls
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3BucketName } from './aws-clients';

export interface S3Object {
  key: string;
  size?: number;
  lastModified?: Date;
}

/**
 * Upload object to S3
 */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string }> {
  const client = getS3Client();
  const bucket = getS3BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);
  return { key };
}

/**
 * Get object from S3
 */
export async function getObject(key: string): Promise<string> {
  const client = getS3Client();
  const bucket = getS3BucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  const body = await response.Body?.transformToString();
  
  if (!body) {
    throw new Error('Empty response body');
  }

  return body;
}

/**
 * Get presigned URL for S3 object
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();
  const bucket = getS3BucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete object from S3
 */
export async function deleteObject(key: string): Promise<{ success: boolean }> {
  const client = getS3Client();
  const bucket = getS3BucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
  return { success: true };
}

/**
 * Delete multiple objects from S3
 */
export async function deleteObjects(keys: string[]): Promise<{ success: boolean }> {
  const client = getS3Client();
  const bucket = getS3BucketName();

  const command = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
    },
  });

  await client.send(command);
  return { success: true };
}

/**
 * List objects in S3 with prefix
 */
export async function listObjects(prefix?: string): Promise<S3Object[]> {
  const client = getS3Client();
  const bucket = getS3BucketName();

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await client.send(command);

  return (response.Contents || []).map(item => ({
    key: item.Key || '',
    size: item.Size,
    lastModified: item.LastModified,
  }));
}
