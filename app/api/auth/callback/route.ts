import { NextRequest, NextResponse } from 'next/server';

/**
 * Get the base URL considering CloudFront/proxy headers
 */
function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const requestUrl = new URL(request.url);
  
  try {
    console.log('OAuth callback received');
    
    // Check for OAuth error
    const error = requestUrl.searchParams.get('error');
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=auth_failed', baseUrl));
    }

    // Get authorization code and state
    const code = requestUrl.searchParams.get('code');
    // const state = requestUrl.searchParams.get('state'); // TODO: Validate CSRF state
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/?error=no_code', baseUrl));
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
        new URL('/?error=token_exchange_failed', baseUrl)
      );
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful, tokens received:', Object.keys(tokens));

    // Redirect to home using base URL from CloudFront headers
    console.log('Redirecting to:', baseUrl);
    const response = NextResponse.redirect(new URL('/home', baseUrl));
    
    // Set cookies with long expiration (matches refresh token ~30 days)
    // We'll check token expiration via JWT payload, not cookie expiration
    const cookieMaxAge = 30 * 24 * 60 * 60; // 30 days

    // Set ID token
    response.cookies.set('id_token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
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
      new URL(`/?error=callback_failed&details=${encodeURIComponent(String(error))}`, baseUrl)
    );
  }
}
