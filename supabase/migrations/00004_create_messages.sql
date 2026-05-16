-- Create messages table for conversation persistence
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_type text not null check (sender_type in ('user', 'assistant')),
  content text not null default '',
  metadata jsonb,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Users can read messages from their own conversations
create policy "Users can read own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

-- Users can insert messages into their own conversations
create policy "Users can insert own messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

-- Users can update messages in their own conversations
create policy "Users can update own messages"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

-- Indexes for fast lookups
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_created_at_idx on public.messages (conversation_id, created_at asc);
