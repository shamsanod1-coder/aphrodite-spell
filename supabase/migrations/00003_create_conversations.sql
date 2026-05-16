-- Create conversations table for chat persistence
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  relationship_stage text default 'curiosity' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.conversations enable row level security;

-- Users can read their own conversations
create policy "Users can read own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

-- Users can insert their own conversations
create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

-- Users can update their own conversations
create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

-- Index for fast user lookups
create index if not exists conversations_user_id_idx on public.conversations (user_id);
create index if not exists conversations_updated_at_idx on public.conversations (updated_at desc);
