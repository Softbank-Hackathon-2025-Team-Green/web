'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, signUp, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

interface User {
  userId: string;
  username?: string;
  email?: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUser({ ...currentUser, ...attributes });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    try {
      setError('');
      await signIn({ username: email, password });
      await checkUser();
      setShowSignIn(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  }

  async function handleSignUp() {
    try {
      setError('');
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      setError('Sign up successful! Please check your email to verify your account, then sign in.');
      setShowSignUp(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (user) {
    return (
      <div className="p-4 border rounded">
        <p className="mb-2">Signed in as: {user.email || user.username}</p>
        <p className="mb-2 text-sm text-gray-600">User ID: {user.userId}</p>
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
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {!showSignIn && !showSignUp && (
        <div className="space-x-2">
          <button
            onClick={() => setShowSignIn(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign In
          </button>
          <button
            onClick={() => setShowSignUp(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Sign Up
          </button>
        </div>
      )}

      {showSignIn && (
        <div className="space-y-2">
          <h3 className="font-bold">Sign In</h3>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <div className="space-x-2">
            <button
              onClick={handleSignIn}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setShowSignIn(false);
                setError('');
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSignUp && (
        <div className="space-y-2">
          <h3 className="font-bold">Sign Up</h3>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <div className="space-x-2">
            <button
              onClick={handleSignUp}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setShowSignUp(false);
                setError('');
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
