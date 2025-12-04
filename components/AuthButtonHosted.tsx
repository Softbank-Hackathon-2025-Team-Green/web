'use client';

import { useRouter } from 'next/navigation';

/**
 * Authentication button - redirects to login page
 */
export default function AuthButton() {
  const router = useRouter();

  function handleSignIn() {
    router.push('/login');
  }

  return (
    <button
      onClick={handleSignIn}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      Sign In
    </button>
  );
}
