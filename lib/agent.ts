export type AgentIntent =
  | "reply"
  | "summarize"
  | "archive"
  | "followup"
  | "categorize"
  | "unknown";

export type AgentPlan = {
  intent: AgentIntent;
  steps: Array<{ id: string; title: string; detail?: string }>;
  summary: string;
};

export function detectIntent(command: string): AgentIntent {
  const lower = command.toLowerCase();
  if (lower.includes("reply") || lower.includes("respond")) return "reply";
  if (lower.includes("summarize") || lower.includes("summary")) return "summarize";
  if (lower.includes("archive")) return "archive";
  if (lower.includes("follow up") || lower.includes("follow-up")) return "followup";
  if (lower.includes("categorize") || lower.includes("label")) return "categorize";
  return "unknown";
}

export function buildPlan(command: string): AgentPlan {
  const intent = detectIntent(command);
  switch (intent) {
    case "reply":
      return {
        intent,
        steps: [
          { id: "locate", title: "Locate the relevant thread" },
          { id: "draft", title: "Draft a context-aware reply" },
          { id: "review", title: "Await confirmation before sending" },
        ],
        summary: "Draft prepared. Awaiting your approval to send.",
      };
    case "summarize":
      return {
        intent,
        steps: [
          { id: "find", title: "Find the requested thread" },
          { id: "summarize", title: "Generate a concise summary" },
          { id: "deliver", title: "Present summary" },
        ],
        summary: "Summary ready for review.",
      };
    case "archive":
      return {
        intent,
        steps: [
          { id: "filter", title: "Filter matching emails" },
          { id: "archive", title: "Archive selected messages" },
        ],
        summary: "Ready to archive after confirmation.",
      };
    case "followup":
      return {
        intent,
        steps: [
          { id: "track", title: "Locate pending threads" },
          { id: "draft", title: "Draft follow-up message" },
          { id: "schedule", title: "Schedule send after approval" },
        ],
        summary: "Follow-up queued pending approval.",
      };
    case "categorize":
      return {
        intent,
        steps: [
          { id: "scan", title: "Scan inbox for matches" },
          { id: "label", title: "Apply labels or categories" },
        ],
        summary: "Categories ready to apply after confirmation.",
      };
    default:
      return {
        intent,
        steps: [
          { id: "clarify", title: "Clarify intent" },
          { id: "prepare", title: "Prepare execution plan" },
        ],
        summary: "Need more detail to proceed.",
      };
  }
}
