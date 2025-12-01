// Global assumed user ID for testing without authentication
export const ASSUMED_USER_ID = process.env.NEXT_PUBLIC_ASSUMED_USER_ID || 'test-user-123';

// AWS Configuration
export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2',
  s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
  dynamoTable: process.env.NEXT_PUBLIC_DYNAMODB_TABLE || '',
  apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '',
};

export function configureAmplify() {
  // Configuration is now handled server-side via API routes
  // This function is kept for compatibility but does nothing
  console.log('AWS services configured via API routes');
}
