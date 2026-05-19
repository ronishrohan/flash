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

export async function archiveEmail(accessToken: string, { messageId }: { messageId: string }) {
  await gmailFetch(accessToken, `/messages/${messageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
  });
  return { status: "archived" };
}

export async function trashEmail(accessToken: string, { messageId }: { messageId: string }) {
  await gmailFetch(accessToken, `/messages/${messageId}/trash`, { method: "POST" });
  return { status: "trashed" };
}

export async function moveToLabel(
  accessToken: string,
  { messageId, addLabelIds, removeLabelIds }: { messageId: string; addLabelIds?: string[]; removeLabelIds?: string[] }
) {
  await gmailFetch(accessToken, `/messages/${messageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ addLabelIds: addLabelIds ?? [], removeLabelIds: removeLabelIds ?? [] }),
  });
  return { status: "labels_updated" };
}

export async function saveDraft(
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
  const message: Record<string, string> = { raw };
  if (threadId) message.threadId = threadId;

  const draft = await gmailFetch(accessToken, "/drafts", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return { draftId: draft.id, status: "draft_saved" };
}

// ── Calendar ─────────────────────────────────────────────────────────────────

const CAL_BASE = "https://www.googleapis.com/calendar/v3";

async function calFetch(accessToken: string, path: string, opts?: RequestInit) {
  const res = await fetch(`${CAL_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`Calendar API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function listCalendarEvents(
  accessToken: string,
  { calendarId = "primary", timeMin, timeMax, maxResults = 10, query }: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    query?: string;
  }
) {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(Math.min(maxResults, 25)),
  });
  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);
  if (query) params.set("q", query);
  if (!timeMin) params.set("timeMin", new Date().toISOString());

  const data = await calFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  return (data.items ?? []).map((e: {
    id: string; summary?: string; description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    location?: string; attendees?: Array<{ email: string; displayName?: string }>;
    hangoutLink?: string; htmlLink?: string;
  }) => ({
    id: e.id,
    title: e.summary ?? "(no title)",
    description: e.description ?? "",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    location: e.location ?? "",
    attendees: (e.attendees ?? []).map(a => a.email),
    meetLink: e.hangoutLink ?? "",
    link: e.htmlLink ?? "",
  }));
}

export async function createCalendarEvent(
  accessToken: string,
  { title, startDateTime, endDateTime, description, location, attendeeEmails, addMeet, calendarId = "primary" }: {
    title: string;
    startDateTime: string;
    endDateTime: string;
    description?: string;
    location?: string;
    attendeeEmails?: string[];
    addMeet?: boolean;
    calendarId?: string;
  }
) {
  const body: Record<string, unknown> = {
    summary: title,
    start: { dateTime: startDateTime, timeZone: "UTC" },
    end: { dateTime: endDateTime, timeZone: "UTC" },
  };
  if (description) body.description = description;
  if (location) body.location = location;
  if (attendeeEmails?.length) body.attendees = attendeeEmails.map(e => ({ email: e }));
  if (addMeet) body.conferenceData = { createRequest: { requestId: Math.random().toString(36).slice(2) } };

  const params = addMeet ? "?conferenceDataVersion=1" : "";
  const event = await calFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events${params}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    id: event.id,
    title: event.summary,
    start: event.start?.dateTime ?? event.start?.date,
    end: event.end?.dateTime ?? event.end?.date,
    meetLink: event.hangoutLink ?? "",
    link: event.htmlLink ?? "",
    status: "created",
  };
}

export async function deleteCalendarEvent(
  accessToken: string,
  { eventId, calendarId = "primary" }: { eventId: string; calendarId?: string }
) {
  const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) throw new Error(`Calendar delete error ${res.status}`);
  return { status: "deleted" };
}

export async function updateCalendarEvent(
  accessToken: string,
  { eventId, calendarId = "primary", title, startDateTime, endDateTime, description, location, attendeeEmails }: {
    eventId: string;
    calendarId?: string;
    title?: string;
    startDateTime?: string;
    endDateTime?: string;
    description?: string;
    location?: string;
    attendeeEmails?: string[];
  }
) {
  // Fetch existing first to patch
  const existing = await calFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`);
  const patch: Record<string, unknown> = { ...existing };
  if (title) patch.summary = title;
  if (startDateTime) patch.start = { dateTime: startDateTime, timeZone: existing.start?.timeZone ?? "UTC" };
  if (endDateTime) patch.end = { dateTime: endDateTime, timeZone: existing.end?.timeZone ?? "UTC" };
  if (description !== undefined) patch.description = description;
  if (location !== undefined) patch.location = location;
  if (attendeeEmails) patch.attendees = attendeeEmails.map(e => ({ email: e }));

  const event = await calFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return {
    id: event.id,
    title: event.summary,
    start: event.start?.dateTime ?? event.start?.date,
    end: event.end?.dateTime ?? event.end?.date,
    meetLink: event.hangoutLink ?? "",
    status: "updated",
  };
}

export async function listCalendars(accessToken: string) {
  const data = await calFetch(accessToken, "/users/me/calendarList");
  return (data.items ?? []).map((c: { id: string; summary: string; primary?: boolean; backgroundColor?: string }) => ({
    id: c.id,
    name: c.summary,
    primary: c.primary ?? false,
    color: c.backgroundColor ?? "",
  }));
}
