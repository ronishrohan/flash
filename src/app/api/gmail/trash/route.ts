import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGmailAccessToken } from "@/lib/gmail";
import { trashEmail } from "@/lib/gmail-tools";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { messageId } = await req.json();
  if (!messageId) return NextResponse.json({ error: "missing messageId" }, { status: 400 });

  const accessToken = await getGmailAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "no gmail token" }, { status: 401 });

  try {
    const result = await trashEmail(accessToken, { messageId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "trash failed" }, { status: 500 });
  }
}
