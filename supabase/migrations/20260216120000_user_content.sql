create table if not exists public.plans (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  destination text not null,
  days int not null,
  start_date timestamptz null,
  image text not null,
  status text not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plans' and policyname = 'plans_select_own') then
    execute 'create policy "plans_select_own" on public.plans for select using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plans' and policyname = 'plans_insert_own') then
    execute 'create policy "plans_insert_own" on public.plans for insert with check (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plans' and policyname = 'plans_update_own') then
    execute 'create policy "plans_update_own" on public.plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plans' and policyname = 'plans_delete_own') then
    execute 'create policy "plans_delete_own" on public.plans for delete using (auth.uid() = user_id)';
  end if;
end $$;

create index if not exists plans_user_id_idx on public.plans (user_id, created_at desc);

create table if not exists public.travelogues (
  id text primary key,
  uid uuid not null references auth.users (id) on delete cascade,
  title text not null,
  location text not null,
  author text not null,
  avatar text not null,
  date text not null,
  intro text not null,
  cover text not null,
  likes int not null default 0,
  is_public boolean not null default false,
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.travelogues enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'travelogues' and policyname = 'travelogues_select_public_or_own') then
    execute 'create policy "travelogues_select_public_or_own" on public.travelogues for select using (is_public = true or auth.uid() = uid)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'travelogues' and policyname = 'travelogues_insert_own') then
    execute 'create policy "travelogues_insert_own" on public.travelogues for insert with check (auth.uid() = uid)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'travelogues' and policyname = 'travelogues_update_own') then
    execute 'create policy "travelogues_update_own" on public.travelogues for update using (auth.uid() = uid) with check (auth.uid() = uid)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'travelogues' and policyname = 'travelogues_delete_own') then
    execute 'create policy "travelogues_delete_own" on public.travelogues for delete using (auth.uid() = uid)';
  end if;
end $$;

create index if not exists travelogues_uid_created_at_idx on public.travelogues (uid, created_at desc);
create index if not exists travelogues_public_date_idx on public.travelogues (is_public, date desc);

create table if not exists public.chat_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  location_id text not null,
  location_name text not null,
  persona text not null default 'expert',
  preview text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_select_own') then
    execute 'create policy "chat_sessions_select_own" on public.chat_sessions for select using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_insert_own') then
    execute 'create policy "chat_sessions_insert_own" on public.chat_sessions for insert with check (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_update_own') then
    execute 'create policy "chat_sessions_update_own" on public.chat_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_sessions' and policyname = 'chat_sessions_delete_own') then
    execute 'create policy "chat_sessions_delete_own" on public.chat_sessions for delete using (auth.uid() = user_id)';
  end if;
end $$;

create index if not exists chat_sessions_user_updated_idx on public.chat_sessions (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id text primary key,
  session_id text not null references public.chat_sessions (id) on delete cascade,
  sender text not null,
  type text not null,
  content text not null,
  is_content_json boolean not null default false,
  card_data jsonb null,
  audio_url text null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_select_own') then
    execute 'create policy "chat_messages_select_own" on public.chat_messages for select using (exists (select 1 from public.chat_sessions s where s.id = chat_messages.session_id and s.user_id = auth.uid()))';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_insert_own') then
    execute 'create policy "chat_messages_insert_own" on public.chat_messages for insert with check (exists (select 1 from public.chat_sessions s where s.id = chat_messages.session_id and s.user_id = auth.uid()))';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_update_own') then
    execute 'create policy "chat_messages_update_own" on public.chat_messages for update using (exists (select 1 from public.chat_sessions s where s.id = chat_messages.session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.chat_sessions s where s.id = chat_messages.session_id and s.user_id = auth.uid()))';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_delete_own') then
    execute 'create policy "chat_messages_delete_own" on public.chat_messages for delete using (exists (select 1 from public.chat_sessions s where s.id = chat_messages.session_id and s.user_id = auth.uid()))';
  end if;
end $$;

create index if not exists chat_messages_session_created_idx on public.chat_messages (session_id, created_at asc);
