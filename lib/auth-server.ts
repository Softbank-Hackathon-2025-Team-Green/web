import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserInfoFromToken, isTokenExpired } from './jwt-utils';

/**
 * Server-side authentication utilities - NO AMPLIFY
 * Reads JWT tokens directly from HTTP-only cookies
 */

/**
 * Get the authenticated user's ID from cookies
 * Automatically redirects to refresh endpoint if token is expired
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('id_token')?.value;
  
  if (!idToken) {
    return null;
  }

  // Check if token is expired - redirect to refresh endpoint
  if (isTokenExpired(idToken)) {
    console.log('ID token expired, redirecting to refresh...');
    redirect('/api/auth/refresh-redirect');
  }

  const userInfo = getUserInfoFromToken(idToken);
  return userInfo?.userId || null;
}

/**
 * Get detailed user information from the ID token cookie
 * Automatically redirects to refresh endpoint if token is expired
 */
export async function getUserInfo(): Promise<{
  userId: string;
  email?: string;
  username?: string;
} | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('id_token')?.value;
  
  if (!idToken) {
    return null;
  }

  // Check if token is expired - redirect to refresh endpoint
  if (isTokenExpired(idToken)) {
    console.log('ID token expired, redirecting to refresh...');
    redirect('/api/auth/refresh-redirect');
  }

  return getUserInfoFromToken(idToken);
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