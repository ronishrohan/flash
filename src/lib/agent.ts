import { getModel, streamSimple, type Message, type ThinkingLevel } from "@earendil-works/pi-ai";

const SYSTEM_PROMPT = `You are Flash, an assistant for the user's Gmail inbox.

Tone: calm, direct, unhurried. No filler, no enthusiasm, no emoji. Write like a sharp colleague who knows their stuff and doesn't need to prove it. If something is straightforward, say so plainly. If it's not, say that too.

Keep responses short — one to three sentences unless more is clearly needed. No bullet points unless the user asks for a list. No sign-offs, no "sure!", no "great question".

Gmail tools are not connected yet. If the user asks about their actual emails, tell them briefly and move on — offer to help with something else if it makes sense.`;

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
    content: m.role === "assistant"
      ? [{ type: "text", text: String(m.text) }]
      : String(m.text),
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
