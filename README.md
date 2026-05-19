# Flash

An AI assistant for your Gmail inbox. Ask it to read, search, send, archive, and manage your emails and calendar in plain English.

## What it does

- **Email** — list, search, read threads, send, reply, archive, trash, move between labels, save drafts, mark as read
- **Calendar** — list upcoming events, create events (with Google Meet), update and delete events, list all calendars
- **Streaming chat** — responses stream token by token with a thinking spinner
- **Conversation history** — all chats are persisted and accessible from the sidebar
- **Model picker** — switch between DeepSeek V4 Flash and Pro, with Low / Medium / High effort

## Stack

- **Next.js 16** (App Router)
- **Supabase** — auth, database (conversations + Gmail tokens), RLS
- **Pi AI SDK** (`@earendil-works/pi-ai`) — DeepSeek streaming with tool call support
- **Gmail REST API** + **Google Calendar API** — direct REST calls using OAuth access tokens
- **Framer Motion** — animations
- **Tailwind CSS**

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/ronishrohan/flash.git
cd flash
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# DeepSeek (via Pi AI SDK)
DEEPSEEK_API_KEY=your_deepseek_api_key

# Google OAuth (for Gmail + Calendar)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Supabase setup

Run the migrations in order in the Supabase SQL editor:

```
supabase/migrations/0001_gmail_tokens.sql
supabase/migrations/0002_conversations.sql
```

In Supabase Dashboard → Authentication → Providers, enable **Google** and add your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Set the redirect URL to:

```
https://your-project.supabase.co/auth/v1/callback
```

### 4. Google Cloud Console

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Gmail API** and **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application)
4. Add your domain to authorized redirect URIs
5. On the OAuth consent screen, add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar`

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/
    api/              # API routes (chat, conversations, title generation)
    auth/callback/    # Google OAuth callback — stores tokens to Supabase
    dashboard/        # Main app (layout, new chat, conversation view)
    login/            # Auth + Gmail onboarding flow
  components/
    dashboard/        # Sidebar, message list, chat input, settings modal
    ui/               # LiquidGlass, RoseSpinner, reusable primitives
  lib/
    agent.ts          # Agentic loop — Pi SDK + tool execution
    gmail.ts          # Access token refresh logic
    gmail-tools.ts    # Gmail + Calendar REST API functions
    supabase.ts       # Supabase client (browser)
    supabase-server.ts# Supabase client (server)
supabase/
  migrations/         # SQL migrations
```
