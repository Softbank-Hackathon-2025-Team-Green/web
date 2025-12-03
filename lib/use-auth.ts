'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { AuthUser } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from '@/lib/amplify-config';

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
  clearUser: () => void;
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
      
      // Get email from ID token claims (available with oauth/hosted UI)
      let email: string | undefined;
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken;
        email = idToken?.payload?.email as string | undefined;
      } catch {
        // If session fetch fails, continue without email
      }
      
      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Configure Amplify first (must happen before any auth calls)
    Amplify.configure(amplifyConfig, { ssr: true });
    
    // Small delay to ensure OAuth callback is processed
    const timer = setTimeout(() => {
      checkUser();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    refreshUser: checkUser,
    clearUser: () => setUser(null),
  };
}
