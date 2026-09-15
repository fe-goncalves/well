-- Username
alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

-- Passos do dia (separados de calorias/atividades)
create table if not exists public.step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  steps integer not null check (steps >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

create index if not exists step_logs_user_day_idx
  on public.step_logs (user_id, logged_on desc);

alter table public.step_logs enable row level security;

drop policy if exists "step_logs_all_own" on public.step_logs;
create policy "step_logs_all_own" on public.step_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.step_logs (user_id, logged_on, steps)
select user_id, logged_on, steps
from public.activity_entries
where steps is not null and steps > 0
on conflict (user_id, logged_on) do update
  set steps = greatest(public.step_logs.steps, excluded.steps),
      updated_at = now();

alter table public.activity_entries
  alter column category type text using category::text;

alter table public.activity_entries
  alter column category set default 'other';

alter table public.activity_entries
  add column if not exists activity_type text,
  add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  add column if not exists notes text not null default '';

update public.activity_entries
set activity_type = coalesce(activity_type, category)
where activity_type is null;
