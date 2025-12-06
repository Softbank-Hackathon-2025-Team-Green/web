/**
 * Centralized AWS SDK client configuration
 * This file provides singleton instances of AWS clients with consistent configuration
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CodeBuildClient } from '@aws-sdk/client-codebuild';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';


/**
 * Get AWS region from environment variables
 */
function getAwsRegion(): string {
  return process.env.AWS_REGION || 'ap-northeast-2';
}

/**
 * Base configuration for all AWS clients
 */
function getBaseConfig() {
  return {
    region: getAwsRegion(),
  };
}

// Singleton instances
let dynamoDBClient: DynamoDBClient | null = null;
let dynamoDBDocClient: DynamoDBDocumentClient | null = null;
let s3Client: S3Client | null = null;
let lambdaClient: LambdaClient | null = null;
let codeBuildClient: CodeBuildClient | null = null;
let cognitoClient: CognitoIdentityProviderClient | null = null;
let cloudWatchLogsClient: CloudWatchLogsClient | null = null;

/**
 * Get or create DynamoDB client instance
 */
export function getDynamoDBClient(): DynamoDBClient {
  if (!dynamoDBClient) {
    dynamoDBClient = new DynamoDBClient(getBaseConfig());
  }
  return dynamoDBClient;
}

/**
 * Get or create DynamoDB Document client instance
 */
export function getDynamoDBDocClient(): DynamoDBDocumentClient {
  if (!dynamoDBDocClient) {
    const client = getDynamoDBClient();
    dynamoDBDocClient = DynamoDBDocumentClient.from(client);
  }
  return dynamoDBDocClient;
}

/**
 * Get or create S3 client instance
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client(getBaseConfig());
  }
  return s3Client;
}

/**
 * Get or create Lambda client instance
 */
export function getLambdaClient(): LambdaClient {
  if (!lambdaClient) {
    lambdaClient = new LambdaClient(getBaseConfig());
  }
  return lambdaClient;
}

/**
 * Get or create CodeBuild client instance
 */
export function getCodeBuildClient(): CodeBuildClient {
  if (!codeBuildClient) {
    codeBuildClient = new CodeBuildClient(getBaseConfig());
  }
  return codeBuildClient;
}

/**
 * Get or create Cognito client instance
 */
export function getCognitoClient(): CognitoIdentityProviderClient {
  if (!cognitoClient) {
    cognitoClient = new CognitoIdentityProviderClient(getBaseConfig());
  }
  return cognitoClient;
}

/**
 * Get or create CloudWatch Logs client instance
 */
export function getCloudWatchLogsClient(): CloudWatchLogsClient {
  if (!cloudWatchLogsClient) {
    cloudWatchLogsClient = new CloudWatchLogsClient(getBaseConfig());
  }
  return cloudWatchLogsClient;
}

/**
 * Get DynamoDB table name from environment
 */
export function getDynamoDBTableName(): string {
  const tableName = process.env.NEXT_PUBLIC_DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error('DynamoDB table name not configured (NEXT_PUBLIC_DYNAMODB_TABLE)');
  }
  return tableName;
}

/**
 * Get S3 bucket name from environment
 */
export function getS3BucketName(): string {
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET;
  if (!bucketName) {
    throw new Error('S3 bucket name not configured (NEXT_PUBLIC_S3_BUCKET)');
  }
  return bucketName;
}
