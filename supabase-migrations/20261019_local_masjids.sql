-- ── Dhikrly Local Masjids Migration ──
-- Supports up to 5 local masjids per user with Azaan & Iqāmah timings and notification alerts.
-- Ensures zero data loss with unique constraints and Row-Level Security.

create extension if not exists "uuid-ossp";

create table if not exists public.local_masjids (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  masjid_id    text not null,
  data         jsonb not null,
  is_selected  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint local_masjids_user_masjid_unique unique (user_id, masjid_id)
);

create index if not exists local_masjids_user_idx on public.local_masjids(user_id);
create index if not exists local_masjids_updated_idx on public.local_masjids(user_id, updated_at desc);

alter table public.local_masjids enable row level security;

drop policy if exists "Users read own local masjids" on public.local_masjids;
create policy "Users read own local masjids"
  on public.local_masjids for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own local masjids" on public.local_masjids;
create policy "Users insert own local masjids"
  on public.local_masjids for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own local masjids" on public.local_masjids;
create policy "Users update own local masjids"
  on public.local_masjids for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own local masjids" on public.local_masjids;
create policy "Users delete own local masjids"
  on public.local_masjids for delete
  using (auth.uid() = user_id);
