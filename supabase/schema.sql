-- DropStitch: saving your knitting to your account.
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.

-- Everything a person knits, one row per thing: kind 'project', 'yarn' or 'profile' (name and streak).
create table if not exists public.items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('project', 'yarn', 'profile')),
  id text not null,
  data jsonb,
  deleted boolean not null default false,
  -- When the phone last changed it (milliseconds); the newest change wins.
  updated_at bigint not null,
  -- When the server last saved it; phones ask "what changed since…".
  synced_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

create index if not exists items_user_synced on public.items (user_id, synced_at);

-- Keep the newest change: an older edit arriving late (from a phone that was offline) doesn't overwrite it.
create or replace function public.items_keep_newest() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return old;
  end if;
  new.synced_at := now();
  return new;
end;
$$;

drop trigger if exists items_keep_newest on public.items;
create trigger items_keep_newest before insert or update on public.items
  for each row execute function public.items_keep_newest();

-- Each person can only see and change their own rows.
alter table public.items enable row level security;

drop policy if exists "Own items: read" on public.items;
drop policy if exists "Own items: add" on public.items;
drop policy if exists "Own items: change" on public.items;
drop policy if exists "Own items: remove" on public.items;
create policy "Own items: read" on public.items for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own items: add" on public.items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own items: change" on public.items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own items: remove" on public.items for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.items from anon;
grant select, insert, update, delete on public.items to authenticated;

-- Pattern files (PDFs and photos), private: each person has a folder named after their account id.
insert into storage.buckets (id, name, public, file_size_limit)
values ('patterns', 'patterns', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "Own pattern files: read" on storage.objects;
drop policy if exists "Own pattern files: add" on storage.objects;
drop policy if exists "Own pattern files: change" on storage.objects;
drop policy if exists "Own pattern files: remove" on storage.objects;
create policy "Own pattern files: read" on storage.objects for select to authenticated
  using (bucket_id = 'patterns' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own pattern files: add" on storage.objects for insert to authenticated
  with check (bucket_id = 'patterns' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own pattern files: change" on storage.objects for update to authenticated
  using (bucket_id = 'patterns' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own pattern files: remove" on storage.objects for delete to authenticated
  using (bucket_id = 'patterns' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- "Delete my account": removes the signed-in person's login; their rows go with it (on delete cascade).
-- The app removes their pattern files first.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
