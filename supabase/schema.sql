-- LOCKIN Supabase schema for April 2026 B.Tech S4 prep
-- Run this inside Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  total_xp int not null default 0,
  streak_days int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_code text not null,
  duration_minutes int not null check (duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  subject_code text not null,
  file_url text not null,
  file_name text not null,
  file_size int not null check (file_size > 0),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  xp_reward int not null check (xp_reward > 0)
);

insert into public.missions (title, xp_reward)
values
  ('Complete 120 minutes of focused study', 150),
  ('Solve 25 practice questions', 100),
  ('Upload one high-quality material to vault', 80)
on conflict do nothing;

create index if not exists study_logs_user_created_at_idx on public.study_logs (user_id, created_at desc);
create index if not exists study_logs_subject_code_idx on public.study_logs (subject_code);
create index if not exists materials_subject_code_idx on public.materials (subject_code);

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

create or replace function public.increment_profile_xp(profile_id uuid, xp_delta int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set total_xp = total_xp + greatest(xp_delta, 0)
  where id = profile_id;
$$;

create or replace view public.leaderboard_weekly as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.total_xp,
  p.streak_days,
  coalesce(sum(s.duration_minutes), 0)::int as weekly_minutes
from public.profiles p
left join public.study_logs s
  on p.id = s.user_id
 and s.created_at >= date_trunc('day', now()) - interval '7 days'
group by p.id, p.username, p.avatar_url, p.total_xp, p.streak_days;

alter table public.profiles enable row level security;
alter table public.study_logs enable row level security;
alter table public.materials enable row level security;
alter table public.missions enable row level security;

create policy "profiles_select_all"
on public.profiles
for select
using (true);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

create policy "study_logs_select_all"
on public.study_logs
for select
using (true);

create policy "study_logs_insert_own"
on public.study_logs
for insert
with check (auth.uid() = user_id);

create policy "study_logs_update_own"
on public.study_logs
for update
using (auth.uid() = user_id);

create policy "study_logs_delete_own"
on public.study_logs
for delete
using (auth.uid() = user_id);

create policy "materials_select_all"
on public.materials
for select
using (true);

create policy "materials_insert_own"
on public.materials
for insert
with check (auth.uid() = uploaded_by);

create policy "materials_update_own"
on public.materials
for update
using (auth.uid() = uploaded_by);

create policy "materials_delete_own"
on public.materials
for delete
using (auth.uid() = uploaded_by);

create policy "missions_select_all"
on public.missions
for select
using (true);

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

create policy "storage_public_read"
on storage.objects
for select
using (bucket_id = 'materials');

create policy "storage_upload_own"
on storage.objects
for insert
with check (
  bucket_id = 'materials'
  and auth.uid()::text = split_part(name, '/', 2)
);

create policy "storage_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'materials'
  and auth.uid()::text = split_part(name, '/', 2)
);
