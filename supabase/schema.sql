-- ULPPL Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor after creating a new project.
-- All tables are user-scoped via RLS policies that match auth.uid().
--
-- NOTE: If your project previously had `food_entries`, `food_favorites`, and
-- `weight_entries` tables, you can drop them — the app no longer uses them.
-- Uncomment the lines below to delete:
--   drop table if exists public.food_entries;
--   drop table if exists public.food_favorites;
--   drop table if exists public.weight_entries;

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
-- 2. EXERCISE SETS
-- One row per exercise per training day. Records the weight used and the
-- top reps achieved across the working sets. `hit_top` is true when the
-- lifter hit the top of the target rep range — used by the progression
-- analyzer to recommend bumping the weight up.
------------------------------------------------------------
create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_index int not null,            -- 0..4
  exercise_index int not null,       -- index within that day
  weight numeric(6,2) not null,      -- in lb
  top_reps int not null,             -- highest reps across the working sets
  hit_top boolean not null default false,
  performed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, day_index, exercise_index, performed_on)
);

create index if not exists exercise_sets_user_date_idx
  on public.exercise_sets (user_id, performed_on desc);

create index if not exists exercise_sets_user_lift_idx
  on public.exercise_sets (user_id, day_index, exercise_index, performed_on desc);

------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
------------------------------------------------------------
alter table public.workout_completions enable row level security;
alter table public.exercise_sets enable row level security;

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

  -- exercise_sets
  drop policy if exists "es_select_own" on public.exercise_sets;
  drop policy if exists "es_insert_own" on public.exercise_sets;
  drop policy if exists "es_update_own" on public.exercise_sets;
  drop policy if exists "es_delete_own" on public.exercise_sets;
  create policy "es_select_own" on public.exercise_sets
    for select using (auth.uid() = user_id);
  create policy "es_insert_own" on public.exercise_sets
    for insert with check (auth.uid() = user_id);
  create policy "es_update_own" on public.exercise_sets
    for update using (auth.uid() = user_id);
  create policy "es_delete_own" on public.exercise_sets
    for delete using (auth.uid() = user_id);
end $$;
