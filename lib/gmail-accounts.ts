import { supabaseAdmin } from "@/lib/supabase-admin";

export type GmailAccountRecord = {
  id: string;
  user_id: string;
  provider_account_id: string;
  email: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
  token_type: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type GmailAccount = {
  id: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
};

export async function listGmailAccounts(userId: string): Promise<GmailAccount[]> {
  const { data, error } = await supabaseAdmin
    .from("gmail_accounts")
    .select("id, email, is_primary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    data?.map((account) => ({
      id: account.id,
      email: account.email,
      isPrimary: account.is_primary,
      createdAt: account.created_at,
    })) ?? []
  );
}

export async function getGmailAccountById(
  userId: string,
  accountId: string
): Promise<GmailAccountRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("gmail_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", accountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function getPrimaryGmailAccount(
  userId: string
): Promise<GmailAccountRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("gmail_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) return data;

  const { data: fallback, error: fallbackError } = await supabaseAdmin
    .from("gmail_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  return fallback ?? null;
}

export async function upsertGmailAccount(params: {
  userId: string;
  providerAccountId: string;
  email: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  scope?: string | null;
  tokenType?: string | null;
}) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("gmail_accounts")
    .select("id, is_primary, access_token, refresh_token, expires_at")
    .eq("user_id", params.userId)
    .eq("provider_account_id", params.providerAccountId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    const { data: primary } = await supabaseAdmin
      .from("gmail_accounts")
      .select("id")
      .eq("user_id", params.userId)
      .eq("is_primary", true)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("gmail_accounts").insert({
      user_id: params.userId,
      provider_account_id: params.providerAccountId,
      email: params.email,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: params.expiresAt,
      scope: params.scope,
      token_type: params.tokenType,
      is_primary: !primary,
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabaseAdmin
    .from("gmail_accounts")
    .update({
      email: params.email,
      access_token: params.accessToken ?? existing.access_token,
      refresh_token: params.refreshToken ?? existing.refresh_token,
      expires_at: params.expiresAt ?? existing.expires_at,
      scope: params.scope,
      token_type: params.tokenType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function setPrimaryGmailAccount(
  userId: string,
  accountId: string
) {
  const { error: resetError } = await supabaseAdmin
    .from("gmail_accounts")
    .update({ is_primary: false })
    .eq("user_id", userId);

  if (resetError) {
    throw new Error(resetError.message);
  }

  const { error } = await supabaseAdmin
    .from("gmail_accounts")
    .update({ is_primary: true })
    .eq("user_id", userId)
    .eq("id", accountId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeGmailAccount(userId: string, accountId: string) {
  const { error } = await supabaseAdmin
    .from("gmail_accounts")
    .delete()
    .eq("user_id", userId)
    .eq("id", accountId);

  if (error) {
    throw new Error(error.message);
  }

  const { data: primary } = await supabaseAdmin
    .from("gmail_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (!primary) {
    const { data: nextPrimary, error: nextError } = await supabaseAdmin
      .from("gmail_accounts")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextError) {
      throw new Error(nextError.message);
    }

    if (nextPrimary) {
      await supabaseAdmin
        .from("gmail_accounts")
        .update({ is_primary: true })
        .eq("id", nextPrimary.id);
    }
  }
}
