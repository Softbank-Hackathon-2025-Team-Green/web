// Re-export auth functions from aws-amplify for convenience
export { getCurrentUser, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

/**
 * Helper to get user ID with fallback to ASSUMED_USER_ID for testing
 * 
 * @example
 * import { getCurrentUser } from '@/lib/auth-utils';
 * 
 * const userId = await getUserIdOrAssumed();
 */
export async function getUserIdOrAssumed(): Promise<string> {
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    const user = await getCurrentUser();
    return user.userId;
  } catch {
    return process.env.NEXT_PUBLIC_ASSUMED_USER_ID || 'test-user-123';
  }
}
