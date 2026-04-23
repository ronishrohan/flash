import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";
import { createOAuthState } from "@/lib/oauth-state";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Missing Google client id" },
      { status: 500 }
    );
  }

  const redirectUri = new URL("/api/gmail/callback", request.url).toString();
  const state = createOAuthState(userId);
  const url = buildGoogleAuthUrl({ clientId, redirectUri, state });

  return NextResponse.redirect(url);
}
