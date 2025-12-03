'use client';

import { useAuth } from '@/lib/use-auth';
import { signOut } from 'aws-amplify/auth';

/**
 * Simple auth status display component
 * Shows user info if authenticated, otherwise shows a message
 * 
 * For full sign in/sign up UI, use AuthButton component
 */
export default function AuthStatus() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      await refreshUser();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-600">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-gray-600">
        Not signed in
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <div className="font-medium">{user?.email || user?.username}</div>
        <div className="text-xs text-gray-600">ID: {user?.userId.substring(0, 8)}...</div>
      </div>
      <button
        onClick={handleSignOut}
        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
      >
        Sign Out
      </button>
    </div>
  );
}
