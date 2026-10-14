-- Store each dated practice item independently so devices can sync without
-- overwriting unrelated completions in the same day's document.
create table if not exists public.practice_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  area text not null check (area in ('adhkar', 'salah')),
  item_key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date, area, item_key)
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

-- Backfill Adhkār items from the previous per-day JSON documents.
insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'adhkar', entry.key, entry.value, progress.updated_at
from public.daily_progress as progress
cross join lateral jsonb_each(progress.checked) as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;

-- Backfill Ṣalāh items from the previous per-day JSON documents.
insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'prayer:' || entry.key, entry.value, progress.updated_at
from public.salah_progress as progress
cross join lateral jsonb_each(progress.log -> 'prayers') as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;

insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'sunnah:' || entry.key, entry.value, progress.updated_at
from public.salah_progress as progress
cross join lateral jsonb_each(progress.log -> 'sunnah') as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;

insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'night:tahajjud', progress.log -> 'tahajjud', progress.updated_at
from public.salah_progress as progress
where progress.log ? 'tahajjud'
on conflict (user_id, date, area, item_key) do nothing;

insert into public.practice_entries (user_id, date, area, item_key, value, updated_at)
select progress.user_id, progress.date, 'salah', 'nafl:' || entry.key, entry.value, progress.updated_at
from public.salah_progress as progress
cross join lateral jsonb_each(progress.log -> 'nafl') as entry(key, value)
on conflict (user_id, date, area, item_key) do nothing;
