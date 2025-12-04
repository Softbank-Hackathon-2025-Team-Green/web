/**
 * JWT token utilities - NO AMPLIFY DEPENDENCIES
 * Decode and validate JWT tokens from cookies
 */

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  'cognito:username'?: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  [key: string]: unknown;
}

/**
 * Decode a JWT token (base64url)
 * Does NOT verify signature - tokens are assumed valid from Cognito
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Token exp is in seconds, Date.now() is in milliseconds
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }

  // Decode base64 to UTF-8
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Extract user ID from ID token
 */
export function getUserIdFromToken(idToken: string): string | null {
  const payload = decodeJWT(idToken);
  return payload?.sub || null;
}

/**
 * Extract user info from ID token
 */
export function getUserInfoFromToken(idToken: string): {
  userId: string;
  email?: string;
  username?: string;
} | null {
  const payload = decodeJWT(idToken);
  if (!payload?.sub) {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email as string | undefined,
    username: payload['cognito:username'] as string | undefined,
  };
}
