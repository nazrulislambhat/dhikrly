-- ═══════════════════════════════════════════════════════════════════
-- Dhikrly - Migration: push_subscriptions & practice_entries
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── 1. practice_entries (Granular per-item completions) ───────────
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

alter table public.practice_entries enable row level security;

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

-- ── 2. push_subscriptions (Web Push notifications) ─────────────────
create table if not exists public.push_subscriptions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade,
  device_id         text,
  subscription      jsonb not null,
  morning_enabled   boolean not null default false,
  morning_time      text not null default '06:00',
  evening_enabled   boolean not null default false,
  evening_time      text not null default '18:00',
  timezone          text not null default 'UTC',
  last_sent_morning date,
  last_sent_evening date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists push_subs_user_id_idx   on public.push_subscriptions(user_id);
create index if not exists push_subs_device_id_idx on public.push_subscriptions(device_id);
create index if not exists push_subs_morning_idx   on public.push_subscriptions(morning_enabled, morning_time);
create index if not exists push_subs_evening_idx   on public.push_subscriptions(evening_enabled, evening_time);

alter table public.push_subscriptions enable row level security;

-- Service role manages all push subscriptions from Next.js API routes
drop policy if exists "Service role manages push subs" on public.push_subscriptions;
create policy "Service role manages push subs"
  on public.push_subscriptions for all
  using (true)
  with check (true);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_push_subs_updated_at on public.push_subscriptions;
create trigger set_push_subs_updated_at
  before update on public.push_subscriptions for each row execute function public.set_updated_at();
