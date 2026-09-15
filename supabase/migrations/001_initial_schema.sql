-- WELL initial schema (A+B+C aligned to BUSINESS_RULES v3)

create extension if not exists "pgcrypto";

create type public.biological_sex as enum ('female', 'male');
create type public.rhythm_mode as enum ('light', 'standard', 'firm');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack', 'other');
create type public.confidence as enum ('low', 'medium', 'high');
create type public.entry_source as enum ('ai', 'manual', 'ai_edited');
create type public.activity_category as enum ('steps', 'strength', 'cardio', 'sport', 'other');
create type public.goal_type as enum (
  'weight_target',
  'calorie_deficit',
  'calorie_surplus',
  'logging_habit'
);
create type public.goal_status as enum ('active', 'completed', 'cancelled');
create type public.xp_event_type as enum (
  'food_log',
  'food_edit_correct',
  'activity_log',
  'journal_log',
  'journal_photo',
  'day_complete',
  'weight_log',
  'goal_checkin',
  'goal_reached',
  'streak_milestone',
  'badge_earned'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  biological_sex public.biological_sex,
  birth_date date,
  height_cm numeric(5,1) check (height_cm is null or height_cm > 0),
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg > 0),
  activity_factor numeric(3,2) not null default 1.20
    check (activity_factor >= 1.0 and activity_factor <= 2.5),
  tmb_override integer check (tmb_override is null or tmb_override > 0),
  rhythm_mode public.rhythm_mode not null default 'standard',
  timezone text not null default 'America/Sao_Paulo',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg > 0),
  logged_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  created_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  raw_text text not null,
  label text not null,
  meal_slot public.meal_slot not null default 'other',
  calories integer not null check (calories >= 0),
  protein numeric(8,1) not null default 0,
  carbs numeric(8,1) not null default 0,
  fat numeric(8,1) not null default 0,
  confidence public.confidence not null default 'medium',
  source public.entry_source not null default 'ai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_entries_user_day_idx
  on public.food_entries (user_id, logged_on desc, created_at);

create table public.activity_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  category public.activity_category not null default 'other',
  description text not null default '',
  calories_burned integer not null check (calories_burned >= 0),
  steps integer check (steps is null or steps >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activity_entries_user_day_idx
  on public.activity_entries (user_id, logged_on desc, created_at);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_on date not null,
  body text not null default '',
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_type public.goal_type not null,
  title text not null,
  target_value numeric(12,2) not null,
  start_date date not null,
  end_date date not null,
  status public.goal_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index goals_user_status_idx on public.goals (user_id, status);

create table public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  freeze_count integer not null default 0 check (freeze_count >= 0 and freeze_count <= 2),
  consecutive_for_freeze integer not null default 0 check (consecutive_for_freeze >= 0),
  updated_at timestamptz not null default now()
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type public.xp_event_type not null,
  xp_amount integer not null check (xp_amount > 0),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index xp_events_user_created_idx
  on public.xp_events (user_id, created_at desc);

create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon_key text not null default 'star',
  xp_bonus integer not null default 0 check (xp_bonus >= 0)
);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

insert into public.badges (id, name, description, icon_key, xp_bonus) values
  ('first_plate', 'Primeiro prato', 'Registrou a primeira refeição.', 'utensils', 20),
  ('first_move', 'Primeiro movimento', 'Registrou a primeira atividade.', 'move', 20),
  ('first_page', 'Primeira página', 'Escreveu o primeiro diário.', 'book', 20),
  ('honest_fork', 'Garfo honesto', 'Corrigiu uma estimativa da IA.', 'pencil', 25),
  ('streak_7', 'Semana viva', 'Streak de 7 dias.', 'flame', 50),
  ('streak_30', 'Mês firme', 'Streak de 30 dias.', 'flame', 100),
  ('streak_100', 'Centena', 'Streak de 100 dias.', 'crown', 200),
  ('goal_maker', 'Mirante', 'Criou o primeiro objetivo.', 'flag', 20),
  ('goal_finisher', 'Chegada', 'Completou um objetivo.', 'flag', 100),
  ('photo_day', 'Dia revelado', 'Diário com foto.', 'camera', 25),
  ('week_logger', 'Presente na semana', '5 dias com registro na mesma semana.', 'calendar', 50),
  ('balance_aware', 'Olhou o saldo', 'Visitou o resumo semanal 4 semanas seguidas.', 'chart', 40);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.weight_logs enable row level security;
alter table public.food_entries enable row level security;
alter table public.activity_entries enable row level security;
alter table public.journal_entries enable row level security;
alter table public.goals enable row level security;
alter table public.streaks enable row level security;
alter table public.xp_events enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "weight_logs_all_own" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "food_entries_all_own" on public.food_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activity_entries_all_own" on public.activity_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_entries_all_own" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "streaks_select_own" on public.streaks
  for select using (auth.uid() = user_id);
create policy "streaks_update_own" on public.streaks
  for update using (auth.uid() = user_id);

create policy "xp_events_select_own" on public.xp_events
  for select using (auth.uid() = user_id);
create policy "xp_events_insert_own" on public.xp_events
  for insert with check (auth.uid() = user_id);

create policy "badges_read_all" on public.badges
  for select using (true);

create policy "user_badges_select_own" on public.user_badges
  for select using (auth.uid() = user_id);
create policy "user_badges_insert_own" on public.user_badges
  for insert with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

create policy "journal_photos_select_own"
  on storage.objects for select
  using (bucket_id = 'journal-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "journal_photos_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'journal-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "journal_photos_update_own"
  on storage.objects for update
  using (bucket_id = 'journal-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "journal_photos_delete_own"
  on storage.objects for delete
  using (bucket_id = 'journal-photos' and auth.uid()::text = (storage.foldername(name))[1]);
