# Flash: A Natural-Language AI Agent for Gmail and Google Calendar Workflow Automation

**Team number:** `[ENTER TEAM NUMBER]`  
**RCID:** `[ENTER RCID]`  
**Course:** `BCS786 — confirm official course code before submission`  
**Authors:** `[NAME 1]`, `[NAME 2]`, `[NAME 3]`  
**Institution:** `[INSTITUTION NAME]`

## Abstract

Email management requires repeated context switching between reading, searching, replying, organizing, and scheduling. Flash is a prototype AI assistant that lets users perform these tasks through natural-language commands. It combines an agentic chat interface with Gmail and Google Calendar APIs, authenticated access through Google OAuth and Supabase, structured tool calls, and confirmation interfaces for consequential actions. The system renders retrieved mail and calendar results as interactive cards and supports actions such as searching mail, drafting replies, archiving messages, moving messages to Trash, and managing calendar events. This paper presents the problem definition, system architecture, methodology, implementation, preliminary results, limitations, and future work. The current results demonstrate technical feasibility through an end-to-end prototype; a controlled user study and quantitative productivity evaluation remain future work.

**Keywords:** AI agent, email automation, natural-language interface, Gmail API, Google Calendar API, human-in-the-loop, OAuth

## 1. Introduction

Email remains a central productivity tool, but the workflow around it is fragmented. A user must inspect messages, determine intent, locate the relevant thread, compose a response, and switch applications when a message involves a meeting. Rule-based filters help with predictable cases but require manual configuration and do not reliably capture meaning or context.

Flash addresses this problem with a natural-language interface for email and calendar work. Instead of navigating separate controls for each task, a user can ask for an operation such as “show unread messages from my team,” “draft a concise reply,” or “show my upcoming events.” The assistant interprets the request, invokes typed tools, and presents the result in a reviewable interface.

The design goal is not unrestricted autonomous access. Flash uses a human-in-the-loop model: read operations can be performed directly, while actions that send or modify data are represented as drafts or confirmation cards before execution.

## 2. Problem Statement and Objectives

The project addresses three problems:

1. Manual inbox triage consumes attention and requires repeated application switching.
2. Traditional filters match fixed rules rather than the user's intent.
3. Email and calendar workflows are disconnected even though many messages lead to meetings or scheduling actions.

The objectives are to:

- provide one natural-language interface for Gmail and Calendar;
- support structured, auditable tool execution;
- preserve user control over send, delete, and calendar mutations;
- render results in a compact interface that is easy to review; and
- store conversation history so that work can be resumed.

## 3. Related Work

Existing email systems provide search, labels, filters, smart composition, and automated categorization. These features are useful but generally expose individual capabilities rather than a single workflow-level interface. Research on intelligent personal assistants and human-in-the-loop automation shows the value of combining intent interpretation with user approval for actions that have external consequences.

Flash builds on these ideas by treating Gmail and Calendar operations as tools available to a conversational agent. Its contribution is an integrated prototype focused on transparent execution: the user sees data cards, draft content, and confirmation states instead of opaque background automation.

## 4. Proposed Methodology

The system follows this pipeline:

```text
Natural-language request
          ↓
Authenticated chat endpoint
          ↓
Agent selects a typed Gmail/Calendar tool
          ↓
Read result → visual data card
Write request → draft/confirmation card
          ↓
User approval
          ↓
Authenticated API operation
          ↓
Updated conversation and external service state
```

The user first enters a request in the dashboard. The server checks the authenticated Supabase session and resolves a Gmail access token. The agent uses the Pi AI SDK to select from tools for email search, message retrieval, drafting, archive/trash, labels, and calendar operations. Results are streamed back to the dashboard. UI events create email, calendar, draft, and confirmation cards.

For safety, the system prompt instructs the agent to draft email rather than send it directly and to show confirmation before creating, updating, or deleting calendar events. Direct archive and trash actions are authenticated through server routes that validate the request before calling Gmail.

## 5. System Architecture

### 5.1 Client layer

The Next.js App Router dashboard contains the chat input, message list, model controls, conversation sidebar, email cards, calendar cards, and confirmation components. React state controls loading, completion, and inline reply states. Framer Motion provides small transitions for cards and action feedback.

### 5.2 Agent layer

`src/lib/agent.ts` defines the model interface, tool schemas, tool labels, streaming events, and tool execution. Tools are typed with their required arguments, which reduces ambiguity between the natural-language request and the external API call.

### 5.3 Integration layer

`src/lib/gmail-tools.ts` wraps Gmail and Calendar REST calls. `src/lib/gmail.ts` obtains and refreshes the access token. The archive and trash routes authenticate the current user, validate `messageId`, resolve the token, call the integration layer, and return a JSON result or explicit error.

### 5.4 Persistence layer

Supabase stores authentication data, Gmail token metadata, conversations, conversation messages, and user persona information. Conversation messages can contain metadata for rendered agent steps and UI components.

## 6. Implementation

The prototype is implemented with Next.js 16, React 19, TypeScript, Supabase, the Pi AI SDK, Gmail REST API, Google Calendar REST API, Framer Motion, and Tailwind CSS. OAuth is used to connect the user's Google account. The browser communicates with application routes rather than directly handling refresh-token operations.

The current Review 2 implementation adds three important interaction improvements. First, an email card has an inline reply composer that captures what the user wants the reply to say and sends that intent into the chat agent. Second, archive and trash actions execute through authenticated routes and expose pending and completed states. Third, action controls are disabled while a mutation is pending, reducing duplicate requests.

## 7. Preliminary Results

The prototype currently demonstrates:

- natural-language email and calendar queries;
- streamed assistant responses;
- email-list and single-email cards;
- upcoming-calendar event cards;
- inline reply-intent capture;
- archive and trash operations through Gmail routes;
- approval-oriented email drafting and calendar mutations; and
- persisted conversation history.

These results establish functional feasibility for the main interaction path. They do not yet establish a statistically significant productivity improvement. The next evaluation should measure task completion time, task success rate, correction rate, and user-perceived workload against ordinary Gmail workflows.

## 8. Security and Ethical Considerations

The system handles private email and calendar data. Authentication and authorization must therefore be enforced on every server operation. OAuth scopes should be limited to the capabilities needed by the application, secrets must remain outside source control, and test demonstrations should use a disposable account or synthetic messages. User approval is especially important for sending, deleting, or scheduling actions. Future versions should add audit logs, rate limiting, explicit consent screens, and clearer recovery paths for failed or mistaken actions.

## 9. Limitations and Future Work

The current prototype has several limitations:

- automated unit and integration coverage is incomplete;
- a formal user study has not yet been conducted;
- rate limiting and detailed audit logging are still required;
- Gmail access depends on valid OAuth configuration and permissions; and
- the agent's behavior can vary with model output and ambiguous user requests.

Future work will add deterministic confirmation handling, richer audit history, retry and rate-limit policies, multi-account selection, stronger test fixtures, and a controlled evaluation with representative email tasks. The evaluation should compare Flash with standard Gmail interaction and report both time savings and error rates.

## 10. Conclusion

Flash demonstrates a human-in-the-loop AI assistant for Gmail and Google Calendar. Its natural-language interface reduces navigation overhead, while typed tools and confirmation cards make external actions visible and reviewable. The Review 2 prototype provides an end-to-end foundation for reading mail, drafting replies, organizing messages, and viewing or managing calendar events. Further empirical evaluation and production hardening are needed before making claims about productivity or large-scale deployment.

## References

[1] Google, “Gmail API Documentation,” Google for Developers. Available: https://developers.google.com/gmail/api  

[2] Google, “Google Calendar API Documentation,” Google for Developers. Available: https://developers.google.com/calendar/api  

[3] Google, “OAuth 2.0 for Web Server Applications,” Google for Developers. Available: https://developers.google.com/identity/protocols/oauth2  

[4] Supabase, “Supabase Documentation: Auth and PostgreSQL,” https://supabase.com/docs  

[5] Next.js, “Next.js Documentation: App Router,” https://nextjs.org/docs  

## Appendix A — Demo Evidence to Attach

Attach one screenshot for each item and label them `Fig. 1` through `Fig. 5`:

1. Gmail list card after a natural-language search.
2. Inline reply-intent composer.
3. Archive or trash loading/completed state.
4. Calendar event card.
5. Draft or calendar confirmation card.
