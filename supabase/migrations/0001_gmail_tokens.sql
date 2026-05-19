-- gmail_tokens: persisted Google OAuth tokens per user.
-- Run this manually in the Supabase SQL editor (or via supabase CLI).

create table if not exists public.gmail_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_refresh_token text not null,
  provider_access_token text,
  expires_at timestamptz,
  scope text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gmail_tokens enable row level security;

create policy "users can read own gmail tokens"
  on public.gmail_tokens for select
  using (auth.uid() = user_id);

create policy "users can insert own gmail tokens"
  on public.gmail_tokens for insert
  with check (auth.uid() = user_id);

create policy "users can update own gmail tokens"
  on public.gmail_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own gmail tokens"
  on public.gmail_tokens for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_gmail_tokens_updated_at on public.gmail_tokens;
create trigger set_gmail_tokens_updated_at
  before update on public.gmail_tokens
  for each row execute function public.set_updated_at();
