-- Enable UUID generation
create extension if not exists "pgcrypto";

-- NextAuth tables (Auth.js / NextAuth adapter)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text,
  password_hash text
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text
);

create unique index if not exists accounts_provider_unique on accounts (provider, "providerAccountId");

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  "sessionToken" text not null unique,
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- Gmail account storage
create table if not exists gmail_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider_account_id text not null,
  email text not null,
  access_token text,
  refresh_token text,
  expires_at bigint,
  scope text,
  token_type text,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists gmail_accounts_unique on gmail_accounts (user_id, provider_account_id);
create index if not exists gmail_accounts_user_idx on gmail_accounts (user_id);

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists conversations_user_idx on conversations (user_id);

-- Conversation messages
create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists messages_conversation_idx on conversation_messages (conversation_id);
