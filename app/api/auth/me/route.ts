import { NextResponse } from 'next/server';
import { getUserInfo } from '@/lib/auth-server';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 */
export async function GET() {
  try {
    const userInfo = await getUserInfo();
    
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      userId: userInfo.userId,
      email: userInfo.email,
      username: userInfo.username,
    });
  } catch {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
}
