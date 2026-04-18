-- LOCKIN multi-room schema for April 2026
-- Run inside the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  exam_date timestamptz,
  privacy text not null default 'private' check (privacy in ('public', 'private', 'invite_only')),
  invite_code text not null unique,
  banner_url text,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  favorite boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz,
  unique (room_id, user_id)
);

create table if not exists public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null references public.rooms (invite_code) on delete cascade,
  target_email text,
  target_username text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null,
  code text not null,
  color text not null default '#53ff78',
  icon text,
  sort_order int not null default 0,
  unique (room_id, code)
);

create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  duration_minutes int not null check (duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  file_name text not null,
  file_url text not null,
  file_size int not null check (file_size > 0),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists rooms_owner_id_idx on public.rooms (owner_id);
create index if not exists rooms_slug_idx on public.rooms (slug);
create index if not exists room_members_room_id_user_id_idx on public.room_members (room_id, user_id);
create index if not exists room_members_user_id_favorite_idx on public.room_members (user_id, favorite desc, last_seen_at desc nulls last);
create index if not exists room_invites_room_id_status_idx on public.room_invites (room_id, status);
create index if not exists room_invites_target_email_idx on public.room_invites (target_email);
create index if not exists room_invites_target_username_idx on public.room_invites (target_username);
create index if not exists subjects_room_id_sort_order_idx on public.subjects (room_id, sort_order);
create index if not exists study_logs_room_created_idx on public.study_logs (room_id, created_at desc);
create index if not exists study_logs_room_subject_idx on public.study_logs (room_id, subject_id);
create index if not exists materials_room_created_idx on public.materials (room_id, created_at desc);
create index if not exists materials_room_subject_idx on public.materials (room_id, subject_id);

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  loop
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.rooms where invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.user_id = auth.uid()
  );
$$;

create or replace function public.has_room_role(target_room_id uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.user_id = auth.uid()
      and rm.role = any(roles)
  );
$$;

create or replace function public.join_room_by_code(input_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room_id uuid;
begin
  select id into target_room_id
  from public.rooms
  where invite_code = upper(trim(input_code));

  if target_room_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.room_members (room_id, user_id, role, joined_at, last_seen_at)
  values (target_room_id, auth.uid(), 'member', now(), now())
  on conflict (room_id, user_id)
  do update set last_seen_at = excluded.last_seen_at;

  return target_room_id;
end;
$$;

create or replace view public.room_leaderboard_weekly
with (security_invoker = true)
as
select
  rm.room_id,
  p.id as user_id,
  p.username,
  p.avatar_url,
  coalesce(sum(sl.duration_minutes), 0)::int as weekly_minutes,
  count(sl.id)::int as sessions_count
from public.room_members rm
join public.profiles p on p.id = rm.user_id
left join public.study_logs sl
  on sl.room_id = rm.room_id
 and sl.user_id = rm.user_id
 and sl.created_at >= date_trunc('day', now()) - interval '7 days'
group by rm.room_id, p.id, p.username, p.avatar_url;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_invites enable row level security;
alter table public.subjects enable row level security;
alter table public.study_logs enable row level security;
alter table public.materials enable row level security;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "rooms_select_member_or_public"
on public.rooms
for select
to authenticated
using (privacy = 'public' or public.is_room_member(id));

create policy "rooms_insert_owner"
on public.rooms
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "rooms_update_admin"
on public.rooms
for update
to authenticated
using (public.has_room_role(id, array['owner', 'admin']))
with check (public.has_room_role(id, array['owner', 'admin']));

create policy "rooms_delete_owner"
on public.rooms
for delete
to authenticated
using (public.has_room_role(id, array['owner']));

create policy "room_members_select_members"
on public.room_members
for select
to authenticated
using (public.is_room_member(room_id));

create policy "room_members_insert_admin_or_owner"
on public.room_members
for insert
to authenticated
with check (public.has_room_role(room_id, array['owner', 'admin']));

create policy "room_members_update_owner_admin"
on public.room_members
for update
to authenticated
using (public.has_room_role(room_id, array['owner', 'admin']))
with check (public.has_room_role(room_id, array['owner', 'admin']));

create policy "room_members_delete_owner_admin"
on public.room_members
for delete
to authenticated
using (public.has_room_role(room_id, array['owner', 'admin']));

create policy "room_invites_select_member"
on public.room_invites
for select
to authenticated
using (public.is_room_member(room_id));

create policy "room_invites_insert_owner_admin"
on public.room_invites
for insert
to authenticated
with check (public.has_room_role(room_id, array['owner', 'admin']));

create policy "room_invites_update_owner_admin"
on public.room_invites
for update
to authenticated
using (public.has_room_role(room_id, array['owner', 'admin']))
with check (public.has_room_role(room_id, array['owner', 'admin']));

create policy "subjects_select_members"
on public.subjects
for select
to authenticated
using (public.is_room_member(room_id));

create policy "subjects_insert_owner_admin"
on public.subjects
for insert
to authenticated
with check (public.has_room_role(room_id, array['owner', 'admin']));

create policy "subjects_update_owner_admin"
on public.subjects
for update
to authenticated
using (public.has_room_role(room_id, array['owner', 'admin']))
with check (public.has_room_role(room_id, array['owner', 'admin']));

create policy "subjects_delete_owner_admin"
on public.subjects
for delete
to authenticated
using (public.has_room_role(room_id, array['owner', 'admin']));

create policy "study_logs_select_members"
on public.study_logs
for select
to authenticated
using (public.is_room_member(room_id));

create policy "study_logs_insert_self_member"
on public.study_logs
for insert
to authenticated
with check (auth.uid() = user_id and public.is_room_member(room_id));

create policy "study_logs_update_self"
on public.study_logs
for update
to authenticated
using (auth.uid() = user_id and public.is_room_member(room_id))
with check (auth.uid() = user_id and public.is_room_member(room_id));

create policy "study_logs_delete_self_or_admin"
on public.study_logs
for delete
to authenticated
using ((auth.uid() = user_id and public.is_room_member(room_id)) or public.has_room_role(room_id, array['owner', 'admin']));

create policy "materials_select_members"
on public.materials
for select
to authenticated
using (public.is_room_member(room_id));

create policy "materials_insert_self_member"
on public.materials
for insert
to authenticated
with check (auth.uid() = uploaded_by and public.is_room_member(room_id));

create policy "materials_update_owner_admin_or_uploader"
on public.materials
for update
to authenticated
using ((auth.uid() = uploaded_by and public.is_room_member(room_id)) or public.has_room_role(room_id, array['owner', 'admin']))
with check ((auth.uid() = uploaded_by and public.is_room_member(room_id)) or public.has_room_role(room_id, array['owner', 'admin']));

create policy "materials_delete_owner_admin_or_uploader"
on public.materials
for delete
to authenticated
using ((auth.uid() = uploaded_by and public.is_room_member(room_id)) or public.has_room_role(room_id, array['owner', 'admin']));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  true,
  26214400,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_materials_read_member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'materials'
  and public.is_room_member((split_part(name, '/', 2))::uuid)
);

create policy "storage_materials_insert_member"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'materials'
  and public.is_room_member((split_part(name, '/', 2))::uuid)
  and auth.uid()::text = split_part(name, '/', 3)
);

create policy "storage_materials_update_member"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'materials'
  and public.is_room_member((split_part(name, '/', 2))::uuid)
)
with check (
  bucket_id = 'materials'
  and public.is_room_member((split_part(name, '/', 2))::uuid)
);

create policy "storage_materials_delete_member"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'materials'
  and public.is_room_member((split_part(name, '/', 2))::uuid)
);
