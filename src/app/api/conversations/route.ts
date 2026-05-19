import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// GET /api/conversations — list all conversations with messages
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, messages(id, role, content, created_at)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/conversations — create a new conversation
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title, firstMessage } = await req.json();

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, title: title ?? "New conversation" })
    .select("id, title, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert first user message if provided
  if (firstMessage) {
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      role: "user",
      content: firstMessage,
    });
  }

  return NextResponse.json(conv);
}
