import { getModel, stream, type Message } from "@earendil-works/pi-ai";

const SYSTEM_PROMPT = `You are Flash, a focused assistant for the user's Gmail inbox.

Be terse, friendly, and direct. Answer in 1-3 sentences unless the user asks for more.
You don't have Gmail tools available yet — if the user asks something that requires
their email data, tell them the connection is coming soon and ask if you can help
in another way.`;

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export async function* streamChat(history: ChatMessage[]): AsyncIterable<string> {
  const model = getModel("deepseek", "deepseek-v4-flash");

  const messages: Message[] = history.map(m => ({
    role: m.role,
    content: m.text,
    timestamp: Date.now(),
  } as Message));

  const events = stream(model, {
    systemPrompt: SYSTEM_PROMPT,
    messages,
  });

  for await (const event of events) {
    if (event.type === "text_delta") {
      yield event.delta;
    } else if (event.type === "error") {
      throw new Error(event.error.errorMessage ?? "agent stream error");
    }
  }
}
