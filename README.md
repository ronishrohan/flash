# InboxAgent AI

Production-ready Next.js 14+ (App Router) SaaS for Gmail automation.

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
cp .env.example .env.local
```

3. Fill in environment variables

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Create Supabase tables

Run the SQL in `supabase/schema.sql` inside your Supabase SQL editor.

5. Start the dev server

```bash
npm run dev
```

## Auth + Gmail Flow

- App sign-in supports email/password or Google OAuth.
- Gmail connections are stored in `gmail_accounts` and can be multiple per user.
- Select the primary Gmail account from **Settings → Gmail Connections**.

## Notes

- Gmail API calls are routed through `/app/api/gmail/*` and use the primary Gmail account.
- Agent execution is scaffolded in `lib/agent.ts` with placeholder steps for now.
