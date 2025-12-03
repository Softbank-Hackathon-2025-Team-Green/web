import { Amplify } from 'aws-amplify';

// Global assumed user ID for testing without authentication
export const ASSUMED_USER_ID = process.env.NEXT_PUBLIC_ASSUMED_USER_ID || 'test-user-123';

// AWS Configuration
export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2',
  s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
  dynamoTable: process.env.NEXT_PUBLIC_DYNAMODB_TABLE || '',
  apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '',
};

// Amplify Auth Configuration
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2',
      // Hosted UI configuration (optional)
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || 'http://localhost:3000/'],
          redirectSignOut: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || 'http://localhost:3000/'],
          responseType: 'code' as const,
        }
      }
    }
  }
};

export function configureAmplify() {
  Amplify.configure(amplifyConfig, { ssr: true });
}
