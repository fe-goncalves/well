-- Biblioteca pessoal de alimentos (reuso sem IA)
create table public.food_saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  calories integer not null check (calories >= 0),
  protein numeric(8,1) not null default 0,
  carbs numeric(8,1) not null default 0,
  fat numeric(8,1) not null default 0,
  default_meal_slot text,
  times_used integer not null default 0 check (times_used >= 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_saved_user_label_idx
  on public.food_saved (user_id, lower(label));

create index food_saved_user_used_idx
  on public.food_saved (user_id, last_used_at desc nulls last, times_used desc);

alter table public.food_saved enable row level security;

create policy "food_saved_all_own" on public.food_saved
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
