import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getModel, streamSimple } from "@earendil-works/pi-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userMessage, assistantMessage } = await req.json();

  let title = "";
  try {
    const model = getModel("deepseek", "deepseek-v4-flash");
    const events = streamSimple(model, {
      systemPrompt: "Generate a short 3-6 word title for a conversation. Respond with only the title, no quotes, no punctuation at the end.",
      messages: [{
        role: "user",
        content: `User said: "${userMessage}"\nAssistant replied: "${String(assistantMessage).slice(0, 200)}"`,
        timestamp: Date.now(),
      }],
    }, { reasoning: "low" });

    for await (const event of events) {
      if (event.type === "text_delta") title += event.delta;
    }
    title = title.trim().slice(0, 60);
  } catch {
    title = String(userMessage).slice(0, 60);
  }

  await supabase.from("conversations").update({ title }).eq("id", id).eq("user_id", user.id);

  return NextResponse.json({ title });
}
