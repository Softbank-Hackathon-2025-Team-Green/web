'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

/**
 * Simple auth status display component - NO AMPLIFY
 * Shows user info if authenticated, otherwise shows a message
 */
export default function AuthStatus() {
  const [userInfo, setUserInfo] = useState<{ userId: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth status via API
    apiFetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.userId) {
          setUserInfo({ userId: data.userId, email: data.email });
        }
      })
      .catch(() => {
        // Not authenticated
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function handleSignOut() {
    try {
      // Call sign out API endpoint
      await fetch('/api/auth/signout', { method: 'POST' });
      setUserInfo(null);
      window.location.href = '/';
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

  if (!userInfo) {
    return (
      <div className="text-sm text-gray-600">
        Not signed in
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <div className="font-medium">{userInfo.email}</div>
        <div className="text-xs text-gray-600">ID: {userInfo.userId.substring(0, 8)}...</div>
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
