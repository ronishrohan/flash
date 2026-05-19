import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const errorParam = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(errorParam)}`, url.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session || !data.user) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error?.message ?? "auth_failed")}`, url.origin));
  }

  const session = data.session;
  const refreshToken = session.provider_refresh_token;
  const accessToken = session.provider_token;
  const expiresIn = (session as unknown as { provider_token_expires_in?: number }).provider_token_expires_in;

  if (refreshToken && accessToken) {
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { error: upsertError } = await supabase
      .from("gmail_tokens")
      .upsert({
        user_id: data.user.id,
        provider_refresh_token: refreshToken,
        provider_access_token: accessToken,
        expires_at: expiresAt,
        scope: (session as unknown as { provider_scope?: string }).provider_scope ?? null,
        email: data.user.email ?? null,
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("[auth/callback] gmail_tokens upsert failed:", upsertError);
    }

    await supabase.auth.updateUser({ data: { onboarded: true } });
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
