import { getModel, streamSimple, Type, type Message, type ThinkingLevel, type Tool, type ToolCall, type ToolResultMessage } from "@earendil-works/pi-ai";
import type { EmailItem, EventItem } from "@/components/dashboard/data-cards";
import { getGmailAccessToken } from "./gmail";
import {
  listEmails, getEmail, searchEmails, sendEmail, getLabels, markAsRead, getThread,
  archiveEmail, trashEmail, moveToLabel, saveDraft,
  listCalendarEvents, createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, listCalendars,
} from "./gmail-tools";

const SYSTEM_PROMPT = `You are Flash, an AI assistant with full access to the user's Gmail inbox and Google Calendar.

Tone: calm, direct, unhurried. No filler, no enthusiasm, no emoji. Write like a sharp colleague who knows their stuff and doesn't need to prove it. Keep responses short unless more is clearly needed. No bullet points unless the user asks for a list. No sign-offs, no "sure!", no "great question".

You have Gmail and Calendar tools available. Use them whenever relevant.

CRITICAL — Email sending rules:
- NEVER call send_email directly. Always use draft_email instead.
- When the user asks you to send, compose, or write an email, call draft_email — this shows the user a draft for approval before anything is sent.
- Only after the user explicitly approves the draft (from the UI) will the email actually be sent.
- If asked to send multiple emails, draft each one separately.

You also have a render_ui tool. Use it to show data visually instead of listing it in text:
- After fetching a list of emails → call render_ui with component "email_list" and the relevant emails as data
- After fetching a single email's content → call render_ui with component "email_card" and that email as data  
- After fetching calendar events → call render_ui with component "event_list" and the events as data
- Only render what the user actually asked for — if they asked for 3 emails, pass 3. If one email, pass 1.
- Always call render_ui BEFORE writing your text response so the card appears above your commentary.
- Do not describe the data in text if you're rendering it — just add a brief comment if needed.`;

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
    name: "draft_email",
    description: "ALWAYS use this instead of send_email when the user wants to send an email. Shows the user a draft card for review before sending. Never call send_email directly — always draft first and let the user approve.",
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
  {
    name: "render_ui",
    description: "Render a visual UI card instead of listing data as text. Use after fetching emails or events.",
    parameters: Type.Object({
      component: Type.String({ description: "Component to render: 'email_list', 'email_card', or 'event_list'" }),
      data: Type.Any({ description: "The data to display — array of emails, single email, or array of events" }),
    }),
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
      case "draft_email":   result = "Draft shown to user for approval."; break; // intercepted as UI event
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

export type UIComponent = "email_list" | "email_card" | "event_list" | "email_draft";
export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string }
  | { type: "ui"; component: UIComponent; data: unknown };

const TOOL_LABELS: Record<string, string> = {
  list_emails:           "Reading your inbox",
  get_email:             "Opening email",
  search_emails:         "Searching your mail",
  send_email:            "Sending email",
  save_draft:            "Saving draft",
  draft_email:           "Drafting email",
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
  persona?: string | null,
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
    const systemPrompt = persona
      ? `${SYSTEM_PROMPT}\n\nUSER WRITING PERSONA (use this when composing emails on their behalf):\n${persona}`
      : SYSTEM_PROMPT;

    const events = streamSimple(model, {
      systemPrompt,
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
      // render_ui and draft_email are frontend-only — intercept, never execute on backend
      if (tc.name === "render_ui") {
        const { component, data } = tc.arguments as { component: UIComponent; data: unknown };
        yield { type: "ui", component, data };
        messages.push({
          role: "toolResult",
          toolCallId: tc.id,
          toolName: tc.name,
          content: [{ type: "text", text: "UI rendered." }],
          isError: false,
          timestamp: Date.now(),
        } as ToolResultMessage);
        continue;
      }

      if (tc.name === "draft_email") {
        const { to, subject, body, threadId } = tc.arguments as { to: string; subject: string; body: string; threadId?: string };
        yield { type: "ui", component: "email_draft", data: { to, subject, body, threadId } };
        messages.push({
          role: "toolResult",
          toolCallId: tc.id,
          toolName: tc.name,
          content: [{ type: "text", text: "Draft shown to user for approval." }],
          isError: false,
          timestamp: Date.now(),
        } as ToolResultMessage);
        continue;
      }

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
