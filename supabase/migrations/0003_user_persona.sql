create table if not exists public.user_persona (
  user_id uuid primary key references auth.users(id) on delete cascade,
  persona text not null,
  generated_at timestamptz not null default now()
);

alter table public.user_persona enable row level security;

create policy "users can read own persona"
  on public.user_persona for select
  using (auth.uid() = user_id);

create policy "users can insert own persona"
  on public.user_persona for insert
  with check (auth.uid() = user_id);

create policy "users can update own persona"
  on public.user_persona for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
