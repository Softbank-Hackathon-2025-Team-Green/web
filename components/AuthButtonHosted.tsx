'use client';

import { useAuth } from '@/lib/use-auth';
import { signInWithRedirect, signOut } from 'aws-amplify/auth';

/**
 * Authentication button using AWS Cognito Hosted UI
 * Redirects to AWS-managed login page instead of custom forms
 */
export default function AuthButtonHosted() {
  const { user, isAuthenticated, isLoading, clearUser } = useAuth();

  async function handleSignIn() {
    try {
      await signInWithRedirect();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  }

  async function handleSignOut() {
    try {
      // Sign out locally without going through Cognito's logout endpoint
      // This prevents the logout_uri parameter issue
      await signOut({ global: false });
      clearUser(); // Clear user state immediately
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <div className="p-4 border rounded">
        <p className="mb-2">Signed in as: {user?.email || user?.username}</p>
        <p className="mb-2 text-sm text-gray-600">User ID: {user?.userId}</p>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <button
        onClick={handleSignIn}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Sign In with AWS
      </button>
    </div>
  );
}
