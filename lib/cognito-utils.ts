/**
 * AWS Cognito SDK utilities for authentication
 * Handles direct authentication with username/password
 */

import {
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { getCognitoClient } from './aws-clients';

// Cognito Configuration
export const COGNITO_CONFIG = {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2',
};

// Create Cognito client
const cognitoClient = getCognitoClient();

export interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
}

export interface SignInResponse {
  success: boolean;
  tokens?: AuthTokens;
  challengeName?: string;
  session?: string;
  error?: string;
}

export interface SignUpResponse {
  success: boolean;
  userSub?: string;
  userConfirmed?: boolean;
  error?: string;
}

/**
 * Sign in with username and password
 */
export async function signIn(
  username: string,
  password: string
): Promise<SignInResponse> {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CONFIG.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);

    // Check if we have a challenge (e.g., NEW_PASSWORD_REQUIRED, MFA)
    if (response.ChallengeName) {
      return {
        success: false,
        challengeName: response.ChallengeName,
        session: response.Session,
      };
    }

    // Successful authentication
    if (response.AuthenticationResult) {
      return {
        success: true,
        tokens: {
          AccessToken: response.AuthenticationResult.AccessToken!,
          IdToken: response.AuthenticationResult.IdToken!,
          RefreshToken: response.AuthenticationResult.RefreshToken,
          ExpiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        },
      };
    }

    return {
      success: false,
      error: 'No authentication result received',
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Sign up a new user
 */
export async function signUp(
  username: string,
  password: string,
  email: string
): Promise<SignUpResponse> {
  try {
    const command = new SignUpCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    });

    const response = await cognitoClient.send(command);

    return {
      success: true,
      userSub: response.UserSub,
      userConfirmed: response.UserConfirmed,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign up failed',
    };
  }
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUp(
  username: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: username,
      ConfirmationCode: code,
    });

    await cognitoClient.send(command);

    return { success: true };
  } catch (error) {
    console.error('Confirm sign up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Confirmation failed',
    };
  }
}

/**
 * Refresh authentication tokens
 */
export async function refreshTokens(
  refreshToken: string
): Promise<SignInResponse> {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: COGNITO_CONFIG.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      return {
        success: true,
        tokens: {
          AccessToken: response.AuthenticationResult.AccessToken!,
          IdToken: response.AuthenticationResult.IdToken!,
          RefreshToken: refreshToken, // Refresh token doesn't change
          ExpiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        },
      };
    }

    return {
      success: false,
      error: 'No authentication result received',
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

/**
 * Get user information from access token
 */
export async function getUserFromToken(
  accessToken: string
): Promise<{ success: boolean; user?: { username: string; attributes: AttributeType[] }; error?: string }> {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await cognitoClient.send(command);

    return {
      success: true,
      user: {
        username: response.Username || '',
        attributes: response.UserAttributes || [],
      },
    };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user info',
    };
  }
}

/**
 * Sign out globally (invalidate all tokens)
 */
export async function globalSignOut(
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await cognitoClient.send(command);

    return { success: true };
  } catch (error) {
    console.error('Global sign out error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed',
    };
  }
}
