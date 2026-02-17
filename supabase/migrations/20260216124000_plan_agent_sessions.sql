create table if not exists public.plan_agent_sessions (
  plan_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

alter table public.plan_agent_sessions enable row level security;

create policy "plan_agent_sessions_select_own" on public.plan_agent_sessions
  for select
  using (auth.uid() = user_id);

create policy "plan_agent_sessions_insert_own" on public.plan_agent_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "plan_agent_sessions_update_own" on public.plan_agent_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plan_agent_sessions_delete_own" on public.plan_agent_sessions
  for delete
  using (auth.uid() = user_id);

create index if not exists plan_agent_sessions_user_updated_idx on public.plan_agent_sessions (user_id, updated_at desc);
