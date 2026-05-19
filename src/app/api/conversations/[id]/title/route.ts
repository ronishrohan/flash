import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { streamChat } from "@/lib/agent";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userMessage, assistantMessage } = await req.json();

  let title = "";
  try {
    for await (const delta of streamChat([
      { role: "user", text: `Generate a short 3-6 word title for a conversation that starts with this message: "${userMessage}"\n\nThe assistant replied: "${assistantMessage.slice(0, 200)}"\n\nRespond with only the title, no quotes, no punctuation at the end.` },
    ], "deepseek-v4-flash", "low")) {
      title += delta;
    }
    title = title.trim().slice(0, 60);
  } catch {
    title = userMessage.slice(0, 60);
  }

  await supabase.from("conversations").update({ title }).eq("id", id).eq("user_id", user.id);

  return NextResponse.json({ title });
}
