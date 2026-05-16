-- Create app sessions table for tracking user engagement
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  metadata jsonb
);

-- Enable RLS
alter table public.sessions enable row level security;

-- Users can read their own sessions
create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

-- Users can insert their own sessions
create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

-- Users can update their own sessions
create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_started_at_idx on public.sessions (started_at desc);
