import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGmailAccessToken } from "@/lib/gmail";
import { getModel, streamSimple } from "@earendil-works/pi-ai";

export const runtime = "nodejs";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function fetchSentEmails(accessToken: string, max = 40): Promise<string[]> {
  const listRes = await fetch(
    `${GMAIL_BASE}/messages?labelIds=SENT&maxResults=${max}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!listRes.ok) return [];
  const list = await listRes.json();
  const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id);

  const bodies: string[] = [];
  await Promise.all(ids.map(async (id) => {
    try {
      const msgRes = await fetch(`${GMAIL_BASE}/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!msgRes.ok) return;
      const msg = await msgRes.json();
      const body = extractBody(msg.payload);
      if (body.trim()) bodies.push(body.slice(0, 800));
    } catch { /* skip */ }
  }));
  return bodies;
}

function extractBody(payload: Record<string, unknown>): string {
  function decode(s: string) {
    const p = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + (4 - s.length % 4) % 4, "=");
    try { return Buffer.from(p, "base64").toString("utf-8"); } catch { return ""; }
  }
  const b = payload?.body as Record<string, string> | undefined;
  if (b?.data) return decode(b.data);
  const parts = payload?.parts as Array<Record<string, unknown>> | undefined;
  if (parts) {
    for (const part of parts) {
      if (part.mimeType === "text/plain") {
        const pb = part.body as Record<string, string> | undefined;
        if (pb?.data) return decode(pb.data);
      }
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Don't regenerate if fresh (< 7 days old)
  const { data: existing } = await supabase
    .from("user_persona")
    .select("persona, generated_at")
    .eq("user_id", user.id)
    .single();

  const force = (await req.json().catch(() => ({}))).force ?? false;
  if (!force && existing?.generated_at) {
    const age = Date.now() - new Date(existing.generated_at).getTime();
    if (age < 7 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ persona: existing.persona, cached: true });
    }
  }

  const accessToken = await getGmailAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "no gmail token" }, { status: 401 });

  const emails = await fetchSentEmails(accessToken, 40);
  if (emails.length === 0) {
    return NextResponse.json({ error: "no sent emails found" }, { status: 404 });
  }

  const emailSample = emails.map((e, i) => `--- Email ${i + 1} ---\n${e}`).join("\n\n");

  let persona = "";
  try {
    const model = getModel("deepseek", "deepseek-v4-flash");
    const events = streamSimple(model, {
      systemPrompt: "You analyze writing samples and produce a precise, actionable persona profile for AI to mimic.",
      messages: [{
        role: "user",
        content: `Analyze these ${emails.length} emails I sent and write a concise but thorough persona profile describing my unique writing style. Cover: vocabulary and word choices, sentence length and structure, punctuation habits, tone and formality level, use of humor or informality, how I open and close emails, any signature phrases or words I use, how I handle cold outreach vs replies, use of emojis or special formatting. Be specific — name actual patterns from the emails, not generic observations. Write 200-400 words.\n\n${emailSample}`,
        timestamp: Date.now(),
      }],
    }, { reasoning: "low" });

    for await (const event of events) {
      if (event.type === "text_delta") persona += event.delta;
    }
    persona = persona.trim();
  } catch (err) {
    return NextResponse.json({ error: `AI error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  await supabase.from("user_persona").upsert({
    user_id: user.id,
    persona,
    generated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return NextResponse.json({ persona });
}
