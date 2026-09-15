-- Domínio completo A+B+C desde o dia 1.
-- Aplicar no projeto Supabase quando a conta/projeto estiver pronto.

create extension if not exists "pgcrypto";

-- Perfil + metas (B)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  daily_calorie_goal integer not null default 2000 check (daily_calorie_goal > 0),
  daily_protein_goal integer check (daily_protein_goal is null or daily_protein_goal > 0),
  timezone text not null default 'America/Sao_Paulo',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Um "dia" por usuário (A)
create table public.days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  free_text text not null default '',
  calorie_total integer not null default 0 check (calorie_total >= 0),
  protein_total numeric(8,1) not null default 0,
  carbs_total numeric(8,1) not null default 0,
  fat_total numeric(8,1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index days_user_date_idx on public.days (user_id, date desc);

-- Itens estimados / editados (A)
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  raw_text text not null,
  label text not null,
  meal_slot text not null default 'other'
    check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  calories integer not null check (calories >= 0),
  protein numeric(8,1) not null default 0,
  carbs numeric(8,1) not null default 0,
  fat numeric(8,1) not null default 0,
  confidence text not null default 'medium'
    check (confidence in ('low', 'medium', 'high')),
  source text not null default 'ai'
    check (source in ('ai', 'manual', 'ai_edited')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_entries_day_idx on public.food_entries (day_id, sort_order, created_at);

-- Streak (B / C)
create table public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_log_date date,
  updated_at timestamptz not null default now()
);

-- Ledger de XP (C) — fonte da verdade; profiles.xp é cache
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'log_entry',
      'day_active',
      'manual_correct',
      'badge_earned'
    )),
  xp_amount integer not null check (xp_amount > 0),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index xp_events_user_created_idx on public.xp_events (user_id, created_at desc);

-- Catálogo + conquistas (C)
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
  ('first_log', 'Primeiro passo', 'Registrou a primeira refeição.', 'footsteps', 20),
  ('streak_3', '3 dias', 'Manteve registro por 3 dias seguidos.', 'flame', 30),
  ('streak_7', 'Semana firme', '7 dias seguidos registrando.', 'flame', 70),
  ('streak_30', 'Ritmo de mês', '30 dias seguidos registrando.', 'crown', 200),
  ('honest_edit', 'Ajuste honesto', 'Corrigiu uma estimativa da IA.', 'pencil', 25),
  ('week_logger', 'Semana presente', 'Registrou em 5 ou mais dias na mesma semana.', 'calendar', 50);

-- Perfil + streak ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recalcula totais do dia a partir dos itens
create or replace function public.refresh_day_totals(p_day_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.days d
  set
    calorie_total = coalesce((
      select sum(fe.calories)::integer from public.food_entries fe where fe.day_id = p_day_id
    ), 0),
    protein_total = coalesce((
      select sum(fe.protein) from public.food_entries fe where fe.day_id = p_day_id
    ), 0),
    carbs_total = coalesce((
      select sum(fe.carbs) from public.food_entries fe where fe.day_id = p_day_id
    ), 0),
    fat_total = coalesce((
      select sum(fe.fat) from public.food_entries fe where fe.day_id = p_day_id
    ), 0),
    updated_at = now()
  where d.id = p_day_id;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.days enable row level security;
alter table public.food_entries enable row level security;
alter table public.streaks enable row level security;
alter table public.xp_events enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "days_all_own" on public.days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "food_entries_all_own" on public.food_entries
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
