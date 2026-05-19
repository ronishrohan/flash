import { getModel, streamSimple, Type, type Message, type ThinkingLevel, type Tool, type ToolCall, type ToolResultMessage } from "@earendil-works/pi-ai";
import { getGmailAccessToken } from "./gmail";
import {
  listEmails, getEmail, searchEmails, sendEmail, getLabels, markAsRead, getThread,
  archiveEmail, trashEmail, moveToLabel, saveDraft,
  listCalendarEvents, createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, listCalendars,
} from "./gmail-tools";

const SYSTEM_PROMPT = `You are Flash, an AI assistant with full access to the user's Gmail inbox.

Tone: calm, direct, unhurried. No filler, no enthusiasm, no emoji. Write like a sharp colleague who knows their stuff and doesn't need to prove it. Keep responses short unless more is clearly needed. No bullet points unless the user asks for a list. No sign-offs, no "sure!", no "great question".

You have Gmail tools available. Use them whenever the user asks about their emails, inbox, or anything email-related. Don't describe what you're about to do — just do it and report the result concisely.`;

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

const GMAIL_TOOLS: Tool[] = [
  {
    name: "list_emails",
    description: "List emails from the inbox. Use to get recent emails or filter by label.",
    parameters: Type.Object({
      maxResults: Type.Optional(Type.Number({ description: "Number of emails to return (max 25)" })),
      query: Type.Optional(Type.String({ description: "Gmail search query (e.g. 'is:unread', 'from:boss@company.com')" })),
      labelIds: Type.Optional(Type.Array(Type.String(), { description: "Filter by label IDs e.g. ['INBOX', 'UNREAD']" })),
    }),
  },
  {
    name: "get_email",
    description: "Get the full content of a specific email by its message ID.",
    parameters: Type.Object({
      messageId: Type.String({ description: "The Gmail message ID" }),
    }),
  },
  {
    name: "search_emails",
    description: "Search emails using Gmail search syntax.",
    parameters: Type.Object({
      query: Type.String({ description: "Gmail search query" }),
      maxResults: Type.Optional(Type.Number({ description: "Max results to return" })),
    }),
  },
  {
    name: "send_email",
    description: "Send an email.",
    parameters: Type.Object({
      to: Type.String({ description: "Recipient email address" }),
      subject: Type.String({ description: "Email subject" }),
      body: Type.String({ description: "Email body (plain text)" }),
      threadId: Type.Optional(Type.String({ description: "Thread ID if replying to an existing thread" })),
    }),
  },
  {
    name: "get_labels",
    description: "Get all Gmail labels for the user's account.",
    parameters: Type.Object({}),
  },
  {
    name: "mark_as_read",
    description: "Mark an email as read.",
    parameters: Type.Object({
      messageId: Type.String({ description: "The Gmail message ID to mark as read" }),
    }),
  },
  {
    name: "get_thread",
    description: "Get all messages in an email thread.",
    parameters: Type.Object({
      threadId: Type.String({ description: "The Gmail thread ID" }),
    }),
  },
  {
    name: "archive_email",
    description: "Archive an email (removes it from inbox but keeps it).",
    parameters: Type.Object({
      messageId: Type.String({ description: "The Gmail message ID" }),
    }),
  },
  {
    name: "trash_email",
    description: "Move an email to trash.",
    parameters: Type.Object({
      messageId: Type.String({ description: "The Gmail message ID" }),
    }),
  },
  {
    name: "move_to_label",
    description: "Add or remove labels from an email (use to move between folders/labels).",
    parameters: Type.Object({
      messageId: Type.String({ description: "The Gmail message ID" }),
      addLabelIds: Type.Optional(Type.Array(Type.String(), { description: "Label IDs to add" })),
      removeLabelIds: Type.Optional(Type.Array(Type.String(), { description: "Label IDs to remove" })),
    }),
  },
  {
    name: "save_draft",
    description: "Save an email as a draft without sending.",
    parameters: Type.Object({
      to: Type.String({ description: "Recipient email address" }),
      subject: Type.String({ description: "Email subject" }),
      body: Type.String({ description: "Email body (plain text)" }),
      threadId: Type.Optional(Type.String({ description: "Thread ID if replying" })),
    }),
  },
  {
    name: "list_calendar_events",
    description: "List upcoming calendar events. Defaults to events from now onward.",
    parameters: Type.Object({
      calendarId: Type.Optional(Type.String({ description: "Calendar ID, defaults to 'primary'" })),
      timeMin: Type.Optional(Type.String({ description: "Start of range in ISO 8601 format" })),
      timeMax: Type.Optional(Type.String({ description: "End of range in ISO 8601 format" })),
      maxResults: Type.Optional(Type.Number({ description: "Max events to return" })),
      query: Type.Optional(Type.String({ description: "Search query" })),
    }),
  },
  {
    name: "create_calendar_event",
    description: "Create a new calendar event. Can optionally add a Google Meet link.",
    parameters: Type.Object({
      title: Type.String({ description: "Event title" }),
      startDateTime: Type.String({ description: "Start datetime in ISO 8601 format" }),
      endDateTime: Type.String({ description: "End datetime in ISO 8601 format" }),
      description: Type.Optional(Type.String({ description: "Event description" })),
      location: Type.Optional(Type.String({ description: "Physical or virtual location" })),
      attendeeEmails: Type.Optional(Type.Array(Type.String(), { description: "Emails to invite" })),
      addMeet: Type.Optional(Type.Boolean({ description: "Add a Google Meet link" })),
      calendarId: Type.Optional(Type.String({ description: "Calendar ID, defaults to 'primary'" })),
    }),
  },
  {
    name: "update_calendar_event",
    description: "Update an existing calendar event.",
    parameters: Type.Object({
      eventId: Type.String({ description: "The event ID" }),
      calendarId: Type.Optional(Type.String({ description: "Calendar ID, defaults to 'primary'" })),
      title: Type.Optional(Type.String()),
      startDateTime: Type.Optional(Type.String()),
      endDateTime: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      location: Type.Optional(Type.String()),
      attendeeEmails: Type.Optional(Type.Array(Type.String())),
    }),
  },
  {
    name: "delete_calendar_event",
    description: "Delete a calendar event.",
    parameters: Type.Object({
      eventId: Type.String({ description: "The event ID to delete" }),
      calendarId: Type.Optional(Type.String({ description: "Calendar ID, defaults to 'primary'" })),
    }),
  },
  {
    name: "list_calendars",
    description: "List all calendars in the user's Google Calendar account.",
    parameters: Type.Object({}),
  },
];

async function executeTool(name: string, args: Record<string, unknown>, accessToken: string): Promise<string> {
  try {
    let result: unknown;
    switch (name) {
      case "list_emails":   result = await listEmails(accessToken, args as Parameters<typeof listEmails>[1]); break;
      case "get_email":     result = await getEmail(accessToken, args as Parameters<typeof getEmail>[1]); break;
      case "search_emails": result = await searchEmails(accessToken, args as Parameters<typeof searchEmails>[1]); break;
      case "send_email":    result = await sendEmail(accessToken, args as Parameters<typeof sendEmail>[1]); break;
      case "get_labels":    result = await getLabels(accessToken); break;
      case "mark_as_read":           result = await markAsRead(accessToken, args as Parameters<typeof markAsRead>[1]); break;
      case "get_thread":             result = await getThread(accessToken, args as Parameters<typeof getThread>[1]); break;
      case "archive_email":          result = await archiveEmail(accessToken, args as Parameters<typeof archiveEmail>[1]); break;
      case "trash_email":            result = await trashEmail(accessToken, args as Parameters<typeof trashEmail>[1]); break;
      case "move_to_label":          result = await moveToLabel(accessToken, args as Parameters<typeof moveToLabel>[1]); break;
      case "save_draft":             result = await saveDraft(accessToken, args as Parameters<typeof saveDraft>[1]); break;
      case "list_calendar_events":   result = await listCalendarEvents(accessToken, args as Parameters<typeof listCalendarEvents>[1]); break;
      case "create_calendar_event":  result = await createCalendarEvent(accessToken, args as Parameters<typeof createCalendarEvent>[1]); break;
      case "update_calendar_event":  result = await updateCalendarEvent(accessToken, args as Parameters<typeof updateCalendarEvent>[1]); break;
      case "delete_calendar_event":  result = await deleteCalendarEvent(accessToken, args as Parameters<typeof deleteCalendarEvent>[1]); break;
      case "list_calendars":         result = await listCalendars(accessToken); break;
      default: return `Unknown tool: ${name}`;
    }
    return JSON.stringify(result);
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string }
  | { type: "data"; kind: string; payload: unknown };

const TOOL_LABELS: Record<string, string> = {
  list_emails:           "Reading your inbox",
  get_email:             "Opening email",
  search_emails:         "Searching your mail",
  send_email:            "Sending email",
  save_draft:            "Saving draft",
  get_labels:            "Fetching labels",
  mark_as_read:          "Marking as read",
  get_thread:            "Loading thread",
  archive_email:         "Archiving",
  trash_email:           "Moving to trash",
  move_to_label:         "Moving email",
  list_calendar_events:  "Checking your calendar",
  create_calendar_event: "Creating event",
  update_calendar_event: "Updating event",
  delete_calendar_event: "Deleting event",
  list_calendars:        "Fetching calendars",
};


export async function* streamChat(
  history: ChatMessage[],
  modelId: ModelId = "deepseek-v4-flash",
  effort: Effort = "medium",
  userId?: string,
): AsyncIterable<StreamEvent> {
  const model = getModel("deepseek", modelId);

  // Resolve Gmail access token
  const accessToken = userId ? await getGmailAccessToken(userId) : null;
  const tools = accessToken ? GMAIL_TOOLS : [];

  const messages: Message[] = history.map(m => ({
    role: m.role,
    content: m.role === "assistant"
      ? [{ type: "text" as const, text: String(m.text) }]
      : String(m.text),
    timestamp: Date.now(),
  } as Message));

  // Agentic loop: keep going while the model wants to use tools
  const MAX_TURNS = 8;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const events = streamSimple(model, {
      systemPrompt: SYSTEM_PROMPT,
      messages,
      tools,
    }, { reasoning: EFFORT_TO_THINKING[effort] });

    let finalMessage: import("@earendil-works/pi-ai").AssistantMessage | null = null;
    const toolCalls: ToolCall[] = [];

    for await (const event of events) {
      if (event.type === "text_delta") {
        yield { type: "text", delta: event.delta };
      } else if (event.type === "toolcall_end") {
        toolCalls.push(event.toolCall);
      } else if (event.type === "done") {
        finalMessage = event.message;
      } else if (event.type === "error") {
        throw new Error(event.error.errorMessage ?? "agent stream error");
      }
    }

    if (!finalMessage || finalMessage.stopReason !== "toolUse" || toolCalls.length === 0) {
      break;
    }

    messages.push(finalMessage);

    for (const tc of toolCalls) {
      // Emit tool indicator before executing
      yield { type: "tool", name: TOOL_LABELS[tc.name] ?? "Working…" };

      const resultContent = await executeTool(tc.name, tc.arguments, accessToken!);

      const toolResult: ToolResultMessage = {
        role: "toolResult",
        toolCallId: tc.id,
        toolName: tc.name,
        content: [{ type: "text", text: resultContent }],
        isError: resultContent.startsWith("Tool error:"),
        timestamp: Date.now(),
      };
      messages.push(toolResult);
    }
  }
}
