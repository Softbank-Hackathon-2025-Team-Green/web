/**
 * Client-side API utility with automatic token refresh handling
 */

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Wrapper around fetch that handles token expiration automatically
 * Redirects to refresh endpoint if API returns token_expired error
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  // Check if token expired
  if (response.status === 401) {
    try {
      const data = await response.clone().json();
      if (data.error === 'token_expired') {
        // Redirect to refresh endpoint, which will refresh token and redirect back
        window.location.href = '/api/auth/refresh-redirect';
        // Throw to prevent further processing
        throw new ApiError(401, 'Token expired, redirecting to refresh...', data);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // If JSON parse fails, just return the response
    }
  }
  
  return response;
}

/**
 * Convenience method for JSON APIs with automatic error handling
 */
export async function apiJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `HTTP ${response.status}`,
      errorData
    );
  }
  
  return response.json();
}
