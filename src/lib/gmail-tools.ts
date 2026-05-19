const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailFetch(accessToken: string, path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`Gmail API error ${res.status}: ${await res.text()}`);
  return res.json();
}

function decodeBase64Url(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + (4 - s.length % 4) % 4, "=");
  try {
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractBody(payload: GmailPayload): string {
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) return decodeBase64Url(part.body.data);
    }
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

interface GmailPayload {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
  headers?: { name: string; value: string }[];
}

function header(payload: GmailPayload, name: string): string {
  return payload.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

// ── Tool implementations ──────────────────────────────────────────────────────

export async function listEmails(
  accessToken: string,
  { maxResults = 10, query = "", labelIds }: { maxResults?: number; query?: string; labelIds?: string[] }
) {
  const params = new URLSearchParams({ maxResults: String(Math.min(maxResults, 25)) });
  if (query) params.set("q", query);
  if (labelIds?.length) labelIds.forEach(l => params.append("labelIds", l));

  const data = await gmailFetch(accessToken, `/messages?${params}`);
  const messages: Array<{ id: string; snippet: string }> = data.messages ?? [];

  // Fetch snippets in parallel (metadata only — fast)
  const details = await Promise.all(
    messages.slice(0, 10).map(m =>
      gmailFetch(accessToken, `/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
    )
  );

  return details.map((msg: { id: string; snippet: string; payload: GmailPayload }) => ({
    id: msg.id,
    from: header(msg.payload, "From"),
    subject: header(msg.payload, "Subject"),
    date: header(msg.payload, "Date"),
    snippet: msg.snippet,
  }));
}

export async function getEmail(accessToken: string, { messageId }: { messageId: string }) {
  const msg = await gmailFetch(accessToken, `/messages/${messageId}?format=full`);
  const body = extractBody(msg.payload);
  return {
    id: msg.id,
    from: header(msg.payload, "From"),
    to: header(msg.payload, "To"),
    subject: header(msg.payload, "Subject"),
    date: header(msg.payload, "Date"),
    body: body.slice(0, 4000), // cap at 4k chars
  };
}

export async function searchEmails(
  accessToken: string,
  { query, maxResults = 10 }: { query: string; maxResults?: number }
) {
  return listEmails(accessToken, { query, maxResults });
}

export async function sendEmail(
  accessToken: string,
  { to, subject, body, threadId }: { to: string; subject: string; body: string; threadId?: string }
) {
  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const raw = Buffer.from(mime).toString("base64url");
  const payload: Record<string, string> = { raw };
  if (threadId) payload.threadId = threadId;

  const sent = await gmailFetch(accessToken, "/messages/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { id: sent.id, threadId: sent.threadId, status: "sent" };
}

export async function getLabels(accessToken: string) {
  const data = await gmailFetch(accessToken, "/labels");
  return (data.labels ?? []).map((l: { id: string; name: string; type: string }) => ({
    id: l.id,
    name: l.name,
    type: l.type,
  }));
}

export async function markAsRead(accessToken: string, { messageId }: { messageId: string }) {
  await gmailFetch(accessToken, `/messages/${messageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
  return { status: "marked_read" };
}

export async function getThread(accessToken: string, { threadId }: { threadId: string }) {
  const thread = await gmailFetch(accessToken, `/threads/${threadId}?format=full`);
  return thread.messages.map((msg: { id: string; snippet: string; payload: GmailPayload }) => ({
    id: msg.id,
    from: header(msg.payload, "From"),
    to: header(msg.payload, "To"),
    subject: header(msg.payload, "Subject"),
    date: header(msg.payload, "Date"),
    body: extractBody(msg.payload).slice(0, 2000),
  }));
}
