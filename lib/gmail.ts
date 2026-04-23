import { todayQueryDate } from "@/lib/utils";

type GmailListResponse = {
  messages?: { id: string; threadId: string }[];
  resultSizeEstimate?: number;
};

type GmailMessageResponse = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
};

export type GmailMessage = {
  id: string;
  threadId: string;
  from?: string;
  subject?: string;
  snippet?: string;
  internalDate: string;
  labelIds: string[];
};

export type GmailStats = {
  totalToday: number;
  unread: number;
  drafts: number;
};

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GMAIL_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail API error: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

function getHeader(headers: Array<{ name: string; value: string }> | undefined, name: string) {
  if (!headers) return undefined;
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
    ?.value;
}

function mapMessage(message: GmailMessageResponse): GmailMessage {
  const headers = message.payload?.headers;
  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader(headers, "From"),
    subject: getHeader(headers, "Subject"),
    snippet: message.snippet,
    internalDate: message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString(),
    labelIds: message.labelIds ?? [],
  };
}

export async function listMessages(
  accessToken: string,
  options: { q?: string; maxResults?: number; labelIds?: string[] } = {}
): Promise<GmailMessage[]> {
  const searchParams = new URLSearchParams();
  if (options.q) searchParams.set("q", options.q);
  if (options.maxResults) searchParams.set("maxResults", String(options.maxResults));
  options.labelIds?.forEach((label) => searchParams.append("labelIds", label));

  const list = await gmailFetch<GmailListResponse>(
    `/messages?${searchParams.toString()}`,
    accessToken
  );

  if (!list.messages?.length) {
    return [];
  }

  const details = await Promise.all(
    list.messages.map((message) =>
      gmailFetch<GmailMessageResponse>(
        `/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        accessToken
      )
    )
  );

  return details.map(mapMessage);
}

async function estimate(accessToken: string, query: string) {
  const searchParams = new URLSearchParams({ maxResults: "1", q: query });
  const response = await gmailFetch<GmailListResponse>(
    `/messages?${searchParams.toString()}`,
    accessToken
  );
  return response.resultSizeEstimate ?? 0;
}

export async function getGmailStats(accessToken: string): Promise<GmailStats> {
  const today = todayQueryDate();
  const [totalToday, unread, drafts] = await Promise.all([
    estimate(accessToken, `after:${today}`),
    estimate(accessToken, "is:unread"),
    estimate(accessToken, "in:drafts"),
  ]);

  return { totalToday, unread, drafts };
}
