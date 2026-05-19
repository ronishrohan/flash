import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGmailAccessToken } from "@/lib/gmail";
import { deleteCalendarEvent } from "@/lib/gmail-tools";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const accessToken = await getGmailAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "no gmail token" }, { status: 401 });

  try {
    const { eventId, calendarId } = await req.json();
    if (!eventId) return NextResponse.json({ error: "missing eventId" }, { status: 400 });
    await deleteCalendarEvent(accessToken, { eventId, calendarId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
