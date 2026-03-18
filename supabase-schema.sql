-- ═══════════════════════════════════════════════════════════════════
--  Daily Adhkār & Du'ā — Supabase Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- ── Enable UUID extension (usually already enabled) ─────────────────
create extension if not exists "uuid-ossp";

-- ── 1. daily_progress ───────────────────────────────────────────────
--  One row per (user, date). `checked` is a JSON object: { "dua-id": true }
create table if not exists public.daily_progress (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,                      -- e.g. 2025-03-17
  checked     jsonb not null default '{}',        -- { "ayat-kursi": true, ... }
  updated_at  timestamptz not null default now(),

  constraint daily_progress_user_date_unique unique (user_id, date)
);

create index if not exists daily_progress_user_id_idx on public.daily_progress(user_id);
create index if not exists daily_progress_date_idx    on public.daily_progress(date);

-- ── 2. custom_duas ──────────────────────────────────────────────────
--  Custom duas added by the user, synced across devices
create table if not exists public.custom_duas (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  local_id    text not null,                      -- the "custom-<timestamp>" id from client
  dua         jsonb not null,                     -- full Dua object as JSON
  created_at  timestamptz not null default now(),

  constraint custom_duas_user_local_unique unique (user_id, local_id)
);

create index if not exists custom_duas_user_id_idx on public.custom_duas(user_id);

-- ── 3. user_data ────────────────────────────────────────────────────
--  Streak + notification settings, one row per user
create table if not exists public.user_data (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  streak          jsonb not null default '{"current":0,"best":0,"lastComplete":""}',
  notif_settings  jsonb not null default '{"morningEnabled":false,"morningTime":"06:00","eveningEnabled":false,"eveningTime":"18:00"}',
  updated_at      timestamptz not null default now()
);

-- ── Row-Level Security ───────────────────────────────────────────────
--  Each user can only read/write their own rows.

alter table public.daily_progress enable row level security;
alter table public.custom_duas     enable row level security;
alter table public.user_data       enable row level security;

-- daily_progress policies
create policy "Users can read own progress"
  on public.daily_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.daily_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.daily_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.daily_progress for delete
  using (auth.uid() = user_id);

-- custom_duas policies
create policy "Users can read own custom duas"
  on public.custom_duas for select
  using (auth.uid() = user_id);

create policy "Users can insert own custom duas"
  on public.custom_duas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own custom duas"
  on public.custom_duas for update
  using (auth.uid() = user_id);

create policy "Users can delete own custom duas"
  on public.custom_duas for delete
  using (auth.uid() = user_id);

-- user_data policies
create policy "Users can read own user data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own user data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user data"
  on public.user_data for update
  using (auth.uid() = user_id);

-- ── Helper function: update updated_at automatically ─────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_daily_progress_updated_at
  before update on public.daily_progress
  for each row execute function public.set_updated_at();

create trigger set_user_data_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
--  Done! Next steps:
--  1. Go to Supabase → Authentication → Providers
--  2. Enable "Email" (already on by default)
--  3. Enable "Google" → paste your Google OAuth client ID & secret
--  4. Copy your project URL + anon key into .env.local
-- ═══════════════════════════════════════════════════════════════════
