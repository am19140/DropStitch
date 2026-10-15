-- DropStitch: the waitlist on dropstitch.io, for knitters who want to test the app early.
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.
-- The website can only add an email and fill in an empty phone. Nobody can read the list through the API:
-- it's read in the dashboard (Table editor → waitlist), and testers are picked by hand.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254 and email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone in ('iphone', 'android')),
  created_at timestamptz not null default now(),
  -- Set by hand when someone gets the test.dropstitch.io link.
  invited_at timestamptz
);

create unique index if not exists waitlist_email_key on public.waitlist (email);

alter table public.waitlist enable row level security;

revoke all on public.waitlist from anon, authenticated;
grant insert (email, phone) on public.waitlist to anon, authenticated;

drop policy if exists "anyone can join the waitlist" on public.waitlist;
create policy "anyone can join the waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Step two on the website ("which phone do you use?"): fills in the phone, but only while it's still empty.
create or replace function public.waitlist_phone(p_email text, p_phone text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.waitlist
  set phone = p_phone
  where email = lower(trim(p_email)) and phone is null and p_phone in ('iphone', 'android');
$$;

revoke all on function public.waitlist_phone(text, text) from public, anon, authenticated;
grant execute on function public.waitlist_phone(text, text) to anon, authenticated;
