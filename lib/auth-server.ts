import { cookies } from 'next/headers';
import { getUserInfoFromToken, isTokenExpired } from './jwt-utils';

/**
 * Server-side authentication utilities - NO AMPLIFY
 * Reads JWT tokens directly from HTTP-only cookies
 */

/**
 * Refresh access and ID tokens using the refresh token
 */
async function refreshTokens(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_SECRET;

    if (!cognitoDomain || !clientId) {
      console.error('Missing Cognito configuration');
      return false;
    }

    const tokenEndpoint = `https://${cognitoDomain}/oauth2/token`;
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });

    if (clientSecret) {
      tokenRequestBody.append('client_secret', clientSecret);
    }

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', tokenResponse.status, errorText);
      return false;
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens refreshed successfully');

    // Set cookies with long expiration (matches refresh token ~30 days)
    // We'll check token expiration via JWT payload, not cookie expiration
    const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days

    cookieStore.set('id_token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    return true;
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    return false;
  }
}

/**
 * Get the authenticated user's ID from cookies
 * Automatically refreshes tokens if expired
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    let idToken = cookieStore.get('id_token')?.value;
    
    if (!idToken) {
      return null;
    }

    // Check if token is expired and try to refresh
    if (isTokenExpired(idToken)) {
      console.log('ID token expired, attempting refresh...');
      const refreshed = await refreshTokens();
      
      if (!refreshed) {
        console.log('Token refresh failed');
        return null;
      }
      
      // Get the new token after refresh
      idToken = cookieStore.get('id_token')?.value;
      if (!idToken) {
        return null;
      }
    }

    const userInfo = getUserInfoFromToken(idToken);
    return userInfo?.userId || null;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Get detailed user information from the ID token cookie
 * Automatically refreshes tokens if expired
 */
export async function getUserInfo(): Promise<{
  userId: string;
  email?: string;
  username?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    let idToken = cookieStore.get('id_token')?.value;
    
    if (!idToken) {
      return null;
    }

    // Check if token is expired and try to refresh
    if (isTokenExpired(idToken)) {
      console.log('ID token expired, attempting refresh...');
      const refreshed = await refreshTokens();
      
      if (!refreshed) {
        console.log('Token refresh failed');
        return null;
      }
      
      // Get the new token after refresh
      idToken = cookieStore.get('id_token')?.value;
      if (!idToken) {
        return null;
      }
    }

    return getUserInfoFromToken(idToken);
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}