import {
  getGmailAccountById,
  getPrimaryGmailAccount,
  upsertGmailAccount,
} from "@/lib/gmail-accounts";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GmailAuthResult = {
  accessToken: string;
  accountId: string;
  email: string;
};

export async function getActiveGmailAccess(
  userId: string,
  accountId?: string
): Promise<GmailAuthResult> {
  const account = accountId
    ? await getGmailAccountById(userId, accountId)
    : await getPrimaryGmailAccount(userId);

  if (!account || !account.access_token) {
    throw new Error("No Gmail account connected.");
  }

  const expiresAt = account.expires_at ? Number(account.expires_at) : null;
  const needsRefresh = expiresAt && expiresAt * 1000 < Date.now() + 60_000;

  if (needsRefresh && !account.refresh_token) {
    throw new Error("Gmail refresh token missing. Reconnect account.");
  }

  if (needsRefresh && account.refresh_token) {
    const refreshed = await refreshToken(account.refresh_token);
    await upsertGmailAccount({
      userId,
      providerAccountId: account.provider_account_id,
      email: account.email,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? account.refresh_token,
      expiresAt: refreshed.expires_at,
      scope: refreshed.scope,
      tokenType: refreshed.token_type,
    });

    return {
      accessToken: refreshed.access_token,
      accountId: account.id,
      email: account.email,
    };
  }

  return {
    accessToken: account.access_token,
    accountId: account.id,
    email: account.email,
  };
}

async function refreshToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials.");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to refresh Gmail token.");
  }

  const expiresAt = Math.floor(Date.now() / 1000 + data.expires_in);

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    scope: data.scope,
    token_type: data.token_type,
  };
}
