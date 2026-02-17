alter table public.plans
  add column if not exists plan_data jsonb not null default '{}'::jsonb;

