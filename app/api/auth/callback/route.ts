import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  try {
    console.log('OAuth callback received');
    
    // Check for OAuth error
    const error = requestUrl.searchParams.get('error');
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin));
    }

    // Get authorization code and state
    const code = requestUrl.searchParams.get('code');
    // const state = requestUrl.searchParams.get('state'); // TODO: Validate CSRF state
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/?error=no_code', requestUrl.origin));
    }

    console.log('Authorization code received, exchanging for tokens...');

    // Exchange code for tokens using Cognito token endpoint
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_SECRET; // Server-side only
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || '';

    const tokenEndpoint = `https://${cognitoDomain}/oauth2/token`;
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId!,
      code: code,
      redirect_uri: redirectUri,
    });

    // Add client secret if configured (for confidential clients)
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
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(
        new URL('/?error=token_exchange_failed', requestUrl.origin)
      );
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful, tokens received:', Object.keys(tokens));

    // Set tokens in HTTP-only cookies
    // Get the actual host from CloudFront/proxy headers
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = forwardedHost 
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin;
    console.log('Redirecting to:', baseUrl, { forwardedHost, forwardedProto, origin: requestUrl.origin });
    const response = NextResponse.redirect(new URL('/home', baseUrl));
    
    // Set access token (expires in 1 hour typically)
    response.cookies.set('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600, // Use token expiry or default 1 hour
      path: '/',
    });

    // Set ID token
    response.cookies.set('id_token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/',
    });

    // Set refresh token if present (long-lived)
    if (tokens.refresh_token) {
      response.cookies.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=callback_failed&details=${encodeURIComponent(String(error))}`, requestUrl.origin)
    );
  }
}
