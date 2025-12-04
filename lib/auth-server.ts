import { cookies } from 'next/headers';
import { getUserInfoFromToken, isTokenExpired } from './jwt-utils';

/**
 * Server-side authentication utilities - NO AMPLIFY
 * Reads JWT tokens directly from HTTP-only cookies
 */

/**
 * Get the authenticated user's ID from cookies
 * Returns null if not authenticated or token expired
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('id_token')?.value;
    
    if (!idToken) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(idToken)) {
      console.log('ID token expired');
      return null;
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
 * Returns null if not authenticated
 */
export async function getUserInfo(): Promise<{
  userId: string;
  email?: string;
  username?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('id_token')?.value;
    
    if (!idToken) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(idToken)) {
      console.log('ID token expired');
      return null;
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