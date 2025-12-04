'use client';

/**
 * Authentication button - redirects to Cognito Hosted UI
 */
export default function AuthButton() {
  function handleSignIn() {
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || '');
    
    // Generate random state for CSRF protection
    const state = generateRandomString(32);
    sessionStorage.setItem('oauth_state', state);
    
    // Build Cognito OAuth URL
    const authUrl = `https://${cognitoDomain}/login?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `scope=openid+email+profile&` +
      `redirect_uri=${redirectUri}`;
    
    // Redirect to Cognito Hosted UI
    window.location.href = authUrl;
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

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}
