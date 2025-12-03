import { NextResponse } from 'next/server';
import { getCurrentUser, fetchAuthSession } from '@/lib/auth-utils';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    
    return NextResponse.json({
      userId: user.userId,
      username: user.username,
      session: session ? {
        tokens: !!session.tokens,
        credentials: !!session.credentials,
      } : null,
    });
  } catch {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
}
