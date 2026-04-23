import { supabaseAdmin } from "@/lib/supabase-admin";

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: string | null;
  createdAt: string;
};

export async function listConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (
    data?.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updated_at,
    })) ?? []
  );
}

export async function createConversation(
  userId: string,
  title: string
): Promise<Conversation> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("id, title, updated_at")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    title: data.title,
    updatedAt: data.updated_at,
  };
}

export async function getConversationMessages(
  userId: string,
  conversationId: string
): Promise<ConversationMessage[]> {
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conv) throw new Error("Conversation not found");

  const { data, error } = await supabaseAdmin
    .from("conversation_messages")
    .select("id, role, content, metadata, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    data?.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      metadata: m.metadata,
      createdAt: m.created_at,
    })) ?? []
  );
}

export async function addConversationMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: string | null
) {
  const { error } = await supabaseAdmin
    .from("conversation_messages")
    .insert({ conversation_id: conversationId, role, content, metadata });

  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}
