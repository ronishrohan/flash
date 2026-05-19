import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// POST /api/conversations/[id]/messages — save a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { role, content } = await req.json();

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: id, role, content });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Touch updated_at on the conversation
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);

  return NextResponse.json({ ok: true });
}
