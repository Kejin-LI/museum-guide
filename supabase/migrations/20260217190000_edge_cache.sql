create table if not exists public.edge_cache (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz not null
);

create index if not exists edge_cache_expires_at_idx on public.edge_cache (expires_at);
