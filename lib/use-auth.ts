'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import type { AuthUser } from 'aws-amplify/auth';

interface UserProfile {
  userId: string;
  username?: string;
  email?: string;
}

interface UseAuthReturn {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Custom hook for managing authentication state
 * Use this in client components to get current user information
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, isLoading } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please sign in</div>;
 *   
 *   return <div>Hello, {user?.email}!</div>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function checkUser() {
    try {
      const currentUser: AuthUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email: attributes.email,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkUser();
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    refreshUser: checkUser,
  };
}
