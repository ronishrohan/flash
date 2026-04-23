# InboxAgent AI — Problem Statement

## The Problem

**Email overload is the silent productivity killer for professionals.**

The average knowledge worker spends **28% of their workday** managing email — reading, replying, categorizing, and following up. Despite this massive time investment, most email workflows remain entirely manual. Users context-switch between composing replies, triaging newsletters from critical messages, remembering to follow up on unanswered threads, and keeping their inbox organized across multiple accounts.

Existing solutions fall short in three key ways:

1. **Rule-based filters are brittle.** Gmail filters and labels require exact pattern matching. They can't understand intent, nuance, or context — so they miss the emails that actually matter or misroute the ones that don't.

2. **AI email tools are passive.** Current AI features (smart compose, summary chips) assist individual actions but never *take initiative*. Users still need to open every email, decide what to do, and execute manually.

3. **Multi-account management is fragmented.** Professionals juggling work, personal, and project-specific Gmail accounts have no unified command center — they're forced to switch between tabs, profiles, and disconnected workflows.

## The Opportunity

**InboxAgent AI** solves this by giving users an autonomous email agent they control through natural language. Instead of manually processing every message, users issue high-level commands — *"reply to all unread emails from my team with a status update"*, *"summarize and archive all promotional emails from this week"*, *"flag any emails that need follow-up by Friday"* — and the agent reasons through a multi-step execution plan, interacts with the Gmail API, and completes the task.

## Core Value Proposition

- **Natural language control** — no filters to configure, no rules to maintain
- **Agent-based execution** — intent detection, planning, and autonomous action across emails
- **Multi-account support** — manage all Gmail accounts from a single authenticated dashboard
- **Transparency** — every agent action is visible as a step-by-step plan the user can review before execution

## Target User

Professionals, founders, and power users who treat email as a critical workflow tool but refuse to let it consume their day — people who want to *manage* their inbox, not *live* in it.

## Current State

### Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Auth:** NextAuth 5 (Google OAuth + credentials) with JWT sessions
- **Database:** Supabase (PostgreSQL)
- **Integrations:** Google OAuth 2.0, Gmail API v1
- **Styling:** Tailwind CSS 4, dark theme, IBM Plex Sans + Space Grotesk

### Implemented (v0.2 — Chat-First Revamp)
- Landing page with pixel font (Silkscreen), Electric Kiwi color palette, animated feature cards
- Dual auth (Google OAuth + email/password) with clean single-column layout
- Onboarding flow: connect Gmail → animated indexing sequence → success screen
- Chat-based agent interface (replaces old dashboard/inbox/ai-actions pages)
- Persistent conversations stored in Supabase (conversations + conversation_messages tables)
- Sidebar with new chat button, conversation history, settings, profile, sign out
- Settings modal with blur overlay: Gmail account management (connect/disconnect/switch primary)
- Light + dark mode via next-themes (default: light)
- Design system: Electric Kiwi palette (#CCFF00, #FFFF00, #DFFF00, #000000) with expanded tints
- Fonts: Inter (body), Geist Mono (mono), Silkscreen (pixel headings)
- Icons: HugeIcons free tier (@hugeicons/react)
- Animations: motion (formerly framer-motion) with spring physics, stagger, fade transitions
- Multi-account Gmail connection flow with HMAC-verified OAuth state
- Token refresh logic for Gmail API access
- Middleware-based route protection for /chat and /onboarding
- Agent intent detection + plan generation (rule-based)

### Scaffolded / Not Yet Wired
- Agent execution (intent detection works, actual Gmail mutations not implemented)
- Gmail send/reply/archive/trash actions from chat
- LLM-based agent reasoning (currently rule-based keyword matching)
- Rate limiting on Gmail API calls
- Audit logging for agent actions
