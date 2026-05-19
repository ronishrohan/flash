import { getModel, streamSimple, type Message, type ThinkingLevel } from "@earendil-works/pi-ai";

const SYSTEM_PROMPT = `You are Flash, a focused assistant for the user's Gmail inbox.

Be terse, friendly, and direct. Answer in 1-3 sentences unless the user asks for more.
You don't have Gmail tools available yet — if the user asks something that requires
their email data, tell them the connection is coming soon and ask if you can help
in another way.`;

export type ModelId = "deepseek-v4-flash" | "deepseek-v4-pro";
export type Effort = "low" | "medium" | "high";

const EFFORT_TO_THINKING: Record<Effort, ThinkingLevel> = {
  low: "low",
  medium: "medium",
  high: "high",
};

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export async function* streamChat(
  history: ChatMessage[],
  modelId: ModelId = "deepseek-v4-flash",
  effort: Effort = "medium",
): AsyncIterable<string> {
  const model = getModel("deepseek", modelId);

  const messages: Message[] = history.map(m => ({
    role: m.role,
    content: m.text,
    timestamp: Date.now(),
  } as Message));

  const events = streamSimple(model, {
    systemPrompt: SYSTEM_PROMPT,
    messages,
  }, { reasoning: EFFORT_TO_THINKING[effort] });

  for await (const event of events) {
    if (event.type === "text_delta") {
      yield event.delta;
    } else if (event.type === "error") {
      throw new Error(event.error.errorMessage ?? "agent stream error");
    }
  }
}
