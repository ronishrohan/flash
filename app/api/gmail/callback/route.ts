import { NextResponse } from "next/server";
import { upsertGmailAccount } from "@/lib/gmail-accounts";
import { verifyOAuthState } from "@/lib/oauth-state";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/settings?error=${errorParam}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?error=missing", request.url));
  }

  const payload = verifyOAuthState(state);
  if (!payload) {
    return NextResponse.redirect(new URL("/settings?error=invalid", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?error=oauth", request.url));
  }

  const redirectUri = new URL("/api/gmail/callback", request.url).toString();

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
  };

  if (!tokenResponse.ok || !tokenData.access_token) {
    return NextResponse.redirect(new URL("/settings?error=token", request.url));
  }

  const profileResponse = await fetch(USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const profile = (await profileResponse.json()) as {
    id?: string;
    sub?: string;
    email?: string;
  };

  if (!profile.email || !(profile.id || profile.sub)) {
    return NextResponse.redirect(new URL("/settings?error=profile", request.url));
  }

  const expiresAt = Math.floor(Date.now() / 1000 + tokenData.expires_in);

  try {
    await upsertGmailAccount({
      userId: payload.userId,
      providerAccountId: profile.id ?? profile.sub ?? profile.email,
      email: profile.email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
    });

    return NextResponse.redirect(new URL("/onboarding?connected=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?error=save", request.url));
  }
}
