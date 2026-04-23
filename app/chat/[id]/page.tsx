import ChatClient from "@/components/ChatClient";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatClient conversationId={id} />;
}
