import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return NextResponse.redirect(new URL('/', request.url));
    }

    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_SECRET;

    if (!cognitoDomain || !clientId) {
      console.error('Missing Cognito configuration');
      return NextResponse.redirect(new URL('/', request.url));
    }

    const tokenEndpoint = `https://${cognitoDomain}/oauth2/token`;
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });

    if (clientSecret) {
      tokenRequestBody.append('client_secret', clientSecret);
    }

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(new URL('/home', request.url));
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens refreshed successfully');

    // Get the referer to redirect back to the original page
    const referer = request.headers.get('referer') || '/';
    const refererUrl = new URL(referer);
    const response = NextResponse.redirect(new URL(refererUrl.pathname, request.url));

    // Set cookies with long expiration (matches refresh token ~30 days)
    const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days

    response.cookies.set('id_token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
