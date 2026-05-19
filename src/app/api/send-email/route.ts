import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGmailAccessToken } from "@/lib/gmail";
import { sendEmail } from "@/lib/gmail-tools";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { to, subject, body, threadId } = await req.json();
  if (!to || !subject || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const accessToken = await getGmailAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "no gmail token" }, { status: 401 });

  try {
    const result = await sendEmail(accessToken, { to, subject, body, threadId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "send failed" }, { status: 500 });
  }
}
