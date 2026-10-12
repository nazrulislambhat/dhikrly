-- ═══════════════════════════════════════════════════════════════════
--  Daily Adhkār & Du'ā — Supabase Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── 1. daily_progress ───────────────────────────────────────────────
create table if not exists public.daily_progress (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  checked     jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  constraint daily_progress_user_date_unique unique (user_id, date)
);
create index if not exists daily_progress_user_id_idx on public.daily_progress(user_id);
create index if not exists daily_progress_date_idx    on public.daily_progress(date);

-- ── 2. custom_duas ──────────────────────────────────────────────────
create table if not exists public.custom_duas (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  local_id    text not null,
  dua         jsonb not null,
  created_at  timestamptz not null default now(),
  constraint custom_duas_user_local_unique unique (user_id, local_id)
);
create index if not exists custom_duas_user_id_idx on public.custom_duas(user_id);

-- ── 3. user_data ────────────────────────────────────────────────────
create table if not exists public.user_data (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  streak          jsonb not null default '{"current":0,"best":0,"lastComplete":""}',
  notif_settings  jsonb not null default '{}',
  updated_at      timestamptz not null default now()
);

-- ── 4. salah_progress ──────────────────────────────────────────────
create table if not exists public.salah_progress (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  log         jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  constraint salah_progress_user_date_unique unique (user_id, date)
);
create index if not exists salah_progress_user_id_idx on public.salah_progress(user_id);
create index if not exists salah_progress_date_idx    on public.salah_progress(date);

-- ── 5. practice_entries ─────────────────────────────────────────────
-- One row per item and day prevents a device from replacing unrelated
-- completions when it syncs a changed daily document.
create table if not exists public.practice_entries (
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  area        text not null check (area in ('adhkar', 'salah')),
  item_key    text not null,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  constraint practice_entries_user_item_unique unique (user_id, date, area, item_key)
);
create index if not exists practice_entries_user_date_idx
  on public.practice_entries(user_id, date desc);

-- ── 6. push_subscriptions ───────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade,
  device_id        text,
  subscription     jsonb not null,
  morning_enabled  boolean not null default false,
  morning_time     text not null default '06:00',
  evening_enabled  boolean not null default false,
  evening_time     text not null default '18:00',
  timezone         text not null default 'UTC',
  last_sent_morning date,
  last_sent_evening date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists push_subs_user_id_idx   on public.push_subscriptions(user_id);
create index if not exists push_subs_device_id_idx on public.push_subscriptions(device_id);
create index if not exists push_subs_morning_idx   on public.push_subscriptions(morning_enabled, morning_time);
create index if not exists push_subs_evening_idx   on public.push_subscriptions(evening_enabled, evening_time);

-- ── Row-Level Security ───────────────────────────────────────────────
alter table public.daily_progress     enable row level security;
alter table public.custom_duas        enable row level security;
alter table public.user_data          enable row level security;
alter table public.salah_progress      enable row level security;
alter table public.practice_entries   enable row level security;
alter table public.push_subscriptions enable row level security;

-- salah_progress
create policy "Users read own salah"   on public.salah_progress for select using (auth.uid() = user_id);
create policy "Users insert own salah" on public.salah_progress for insert with check (auth.uid() = user_id);
create policy "Users update own salah" on public.salah_progress for update using (auth.uid() = user_id);
create policy "Users delete own salah" on public.salah_progress for delete using (auth.uid() = user_id);

-- practice_entries
drop policy if exists "Users read own practice entries" on public.practice_entries;
create policy "Users read own practice entries"
  on public.practice_entries for select using (auth.uid() = user_id);
drop policy if exists "Users insert own practice entries" on public.practice_entries;
create policy "Users insert own practice entries"
  on public.practice_entries for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own practice entries" on public.practice_entries;
create policy "Users update own practice entries"
  on public.practice_entries for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own practice entries" on public.practice_entries;
create policy "Users delete own practice entries"
  on public.practice_entries for delete using (auth.uid() = user_id);

create or replace function public.keep_latest_practice_entry()
returns trigger language plpgsql as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists keep_latest_practice_entry on public.practice_entries;
create trigger keep_latest_practice_entry
  before update on public.practice_entries
  for each row execute function public.keep_latest_practice_entry();

-- daily_progress
create policy "Users read own progress"   on public.daily_progress for select using (auth.uid() = user_id);
create policy "Users insert own progress" on public.daily_progress for insert with check (auth.uid() = user_id);
create policy "Users update own progress" on public.daily_progress for update using (auth.uid() = user_id);
create policy "Users delete own progress" on public.daily_progress for delete using (auth.uid() = user_id);

-- custom_duas
create policy "Users read own duas"   on public.custom_duas for select using (auth.uid() = user_id);
create policy "Users insert own duas" on public.custom_duas for insert with check (auth.uid() = user_id);
create policy "Users update own duas" on public.custom_duas for update using (auth.uid() = user_id);
create policy "Users delete own duas" on public.custom_duas for delete using (auth.uid() = user_id);

-- user_data
create policy "Users read own data"   on public.user_data for select using (auth.uid() = user_id);
create policy "Users insert own data" on public.user_data for insert with check (auth.uid() = user_id);
create policy "Users update own data" on public.user_data for update using (auth.uid() = user_id);

-- push_subscriptions — managed by API routes using service role key
create policy "Service role manages push subs"
  on public.push_subscriptions for all
  using (true)
  with check (true);

-- Backfill from existing per-day documents. ON CONFLICT makes this safe to
-- rerun and leaves already-normalized item values untouched.
insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'adhkar', entry.key, entry.value, progress.updated_at
from public.daily_progress as progress
cross join lateral jsonb_each(coalesce(progress.checked, '{}'::jsonb)) as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;

insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'prayer:' || entry.key, entry.value, progress.updated_at
from public.salah_progress as progress
cross join lateral jsonb_each(coalesce(progress.log -> 'prayers', '{}'::jsonb)) as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;

insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'sunnah:' || entry.key, entry.value, progress.updated_at
from public.salah_progress as progress
cross join lateral jsonb_each(coalesce(progress.log -> 'sunnah', '{}'::jsonb)) as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;

insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'night:tahajjud', progress.log -> 'tahajjud', progress.updated_at
from public.salah_progress as progress
where progress.log ? 'tahajjud'
on conflict (user_id, date, area, item_key) do nothing;

insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'nafl:' || entry.key, entry.value, progress.updated_at
from public.salah_progress as progress
cross join lateral jsonb_each(coalesce(progress.log -> 'nafl', '{}'::jsonb)) as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;

-- ── updated_at triggers ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger set_daily_progress_updated_at
  before update on public.daily_progress for each row execute function public.set_updated_at();

create trigger set_salah_progress_updated_at
  before update on public.salah_progress for each row execute function public.set_updated_at();

create trigger set_user_data_updated_at
  before update on public.user_data for each row execute function public.set_updated_at();

create trigger set_push_subs_updated_at
  before update on public.push_subscriptions for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
--  Setup checklist (see README for full instructions):
--  1. Run this SQL in Supabase → SQL Editor
--  2. npx web-push generate-vapid-keys  → add to .env.local
--  3. Add SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET to .env.local
--  4. Deploy — Vercel cron runs automatically
-- ═══════════════════════════════════════════════════════════════════
