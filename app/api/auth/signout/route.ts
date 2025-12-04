import { NextResponse } from 'next/server';

/**
 * Sign out endpoint - clears auth cookies
 * NO AMPLIFY - just remove HTTP-only cookies
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear all auth cookies
    response.cookies.delete('access_token');
    response.cookies.delete('id_token');
    response.cookies.delete('refresh_token');

    console.log('User signed out, cookies cleared');
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
