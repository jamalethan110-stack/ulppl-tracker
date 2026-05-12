-- ULPPL Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor after creating a new project.
-- All tables are user-scoped via RLS policies that match auth.uid().

------------------------------------------------------------
-- 1. WORKOUT COMPLETIONS
-- One row per exercise check per session.
------------------------------------------------------------
create table if not exists public.workout_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_index int not null,            -- 0..4 (Upper, Lower, Push, Pull, Legs)
  exercise_index int not null,       -- index within that day
  kind text not null default 'main', -- 'main' | 'abs'
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, day_index, exercise_index, kind, completed_on)
);

create index if not exists workout_completions_user_date_idx
  on public.workout_completions (user_id, completed_on);

------------------------------------------------------------
-- 2. WEIGHT ENTRIES
------------------------------------------------------------
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(6,2) not null,      -- in user's preferred unit
  unit text not null default 'lb',   -- 'lb' | 'kg'
  entry_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists weight_entries_user_date_idx
  on public.weight_entries (user_id, entry_date desc);

------------------------------------------------------------
-- 3. FOOD ENTRIES
------------------------------------------------------------
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories numeric(7,2) not null default 0,
  protein numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  fat numeric(6,2) not null default 0,
  servings numeric(5,2) not null default 1,
  meal text not null default 'snack',  -- breakfast|lunch|dinner|snack
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists food_entries_user_date_idx
  on public.food_entries (user_id, entry_date desc);

------------------------------------------------------------
-- 4. FOOD FAVORITES (user's reusable food list)
------------------------------------------------------------
create table if not exists public.food_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories numeric(7,2) not null default 0,
  protein numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  fat numeric(6,2) not null default 0,
  serving_label text,                  -- e.g. "1 scoop", "100g"
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
------------------------------------------------------------
alter table public.workout_completions enable row level security;
alter table public.weight_entries enable row level security;
alter table public.food_entries enable row level security;
alter table public.food_favorites enable row level security;

-- Helper to (re)create policies idempotently
do $$
begin
  -- workout_completions
  drop policy if exists "wc_select_own" on public.workout_completions;
  drop policy if exists "wc_insert_own" on public.workout_completions;
  drop policy if exists "wc_update_own" on public.workout_completions;
  drop policy if exists "wc_delete_own" on public.workout_completions;
  create policy "wc_select_own" on public.workout_completions
    for select using (auth.uid() = user_id);
  create policy "wc_insert_own" on public.workout_completions
    for insert with check (auth.uid() = user_id);
  create policy "wc_update_own" on public.workout_completions
    for update using (auth.uid() = user_id);
  create policy "wc_delete_own" on public.workout_completions
    for delete using (auth.uid() = user_id);

  -- weight_entries
  drop policy if exists "we_select_own" on public.weight_entries;
  drop policy if exists "we_insert_own" on public.weight_entries;
  drop policy if exists "we_update_own" on public.weight_entries;
  drop policy if exists "we_delete_own" on public.weight_entries;
  create policy "we_select_own" on public.weight_entries
    for select using (auth.uid() = user_id);
  create policy "we_insert_own" on public.weight_entries
    for insert with check (auth.uid() = user_id);
  create policy "we_update_own" on public.weight_entries
    for update using (auth.uid() = user_id);
  create policy "we_delete_own" on public.weight_entries
    for delete using (auth.uid() = user_id);

  -- food_entries
  drop policy if exists "fe_select_own" on public.food_entries;
  drop policy if exists "fe_insert_own" on public.food_entries;
  drop policy if exists "fe_update_own" on public.food_entries;
  drop policy if exists "fe_delete_own" on public.food_entries;
  create policy "fe_select_own" on public.food_entries
    for select using (auth.uid() = user_id);
  create policy "fe_insert_own" on public.food_entries
    for insert with check (auth.uid() = user_id);
  create policy "fe_update_own" on public.food_entries
    for update using (auth.uid() = user_id);
  create policy "fe_delete_own" on public.food_entries
    for delete using (auth.uid() = user_id);

  -- food_favorites
  drop policy if exists "ff_select_own" on public.food_favorites;
  drop policy if exists "ff_insert_own" on public.food_favorites;
  drop policy if exists "ff_update_own" on public.food_favorites;
  drop policy if exists "ff_delete_own" on public.food_favorites;
  create policy "ff_select_own" on public.food_favorites
    for select using (auth.uid() = user_id);
  create policy "ff_insert_own" on public.food_favorites
    for insert with check (auth.uid() = user_id);
  create policy "ff_update_own" on public.food_favorites
    for update using (auth.uid() = user_id);
  create policy "ff_delete_own" on public.food_favorites
    for delete using (auth.uid() = user_id);
end $$;
