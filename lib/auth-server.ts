import { cookies } from 'next/headers';
import { getUserInfoFromToken, isTokenExpired } from './jwt-utils';

/**
 * Server-side authentication utilities - NO AMPLIFY
 * Reads JWT tokens directly from HTTP-only cookies
 */

/**
 * Custom error for expired tokens
 */
export class TokenExpiredError extends Error {
  constructor() {
    super('Token expired');
    this.name = 'TokenExpiredError';
  }
}

/**
 * Get the authenticated user's ID from cookies
 * Throws TokenExpiredError if token is expired
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('id_token')?.value;
  
  if (!idToken) {
    return null;
  }

  // Check if token is expired - throw error for API endpoints to handle
  if (isTokenExpired(idToken)) {
    console.log('ID token expired');
    throw new TokenExpiredError();
  }

  const userInfo = getUserInfoFromToken(idToken);
  return userInfo?.userId || null;
}

/**
 * Get detailed user information from the ID token cookie
 * Throws TokenExpiredError if token is expired
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

  // Check if token is expired - throw error for API endpoints to handle
  if (isTokenExpired(idToken)) {
    console.log('ID token expired');
    throw new TokenExpiredError();
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