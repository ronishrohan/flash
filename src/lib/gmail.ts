import { createSupabaseServerClient } from "./supabase-server";

interface TokenRow {
  user_id: string;
  provider_refresh_token: string;
  provider_access_token: string | null;
  expires_at: string | null;
  scope: string | null;
}

const EXPIRY_BUFFER_MS = 60_000;

export async function getGmailAccessToken(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("gmail_tokens")
    .select("user_id, provider_refresh_token, provider_access_token, expires_at, scope")
    .eq("user_id", userId)
    .maybeSingle<TokenRow>();

  if (error || !data) return null;

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const fresh = data.provider_access_token && expiresAt - Date.now() > EXPIRY_BUFFER_MS;
  if (fresh) return data.provider_access_token;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[gmail] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set; cannot refresh.");
    return data.provider_access_token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.provider_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    console.error("[gmail] refresh failed:", await res.text());
    return data.provider_access_token;
  }

  const payload = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) return data.provider_access_token;

  const newExpiresAt = payload.expires_in
    ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
    : null;

  await supabase
    .from("gmail_tokens")
    .update({
      provider_access_token: payload.access_token,
      expires_at: newExpiresAt,
    })
    .eq("user_id", userId);

  return payload.access_token;
}
