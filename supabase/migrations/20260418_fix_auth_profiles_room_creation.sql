-- Fix auth/profile/bootstrap drift that causes room creation failures.
-- Safe to run in existing projects.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
  avatar text;
  attempt int := 0;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'user'
  );

  base_username := lower(regexp_replace(base_username, '[^a-z0-9_]+', '', 'g'));
  if base_username = '' then
    base_username := 'user';
  end if;
  base_username := left(base_username, 24);

  avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), ''),
    null
  );

  loop
    candidate_username :=
      case
        when attempt = 0 then base_username
        else left(base_username, greatest(1, 24 - length(attempt::text) - 1)) || '_' || attempt::text
      end;

    begin
      insert into public.profiles (id, username, avatar_url)
      values (new.id, candidate_username, avatar)
      on conflict (id) do update
      set
        username = coalesce(public.profiles.username, excluded.username),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

      exit;
    exception
      when unique_violation then
        if exists (select 1 from public.profiles where id = new.id) then
          exit;
        end if;

        attempt := attempt + 1;
        if attempt > 50 then
          raise;
        end if;
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, username, avatar_url)
select
  u.id,
  left(
    coalesce(
      nullif(lower(regexp_replace(coalesce(nullif(trim(u.raw_user_meta_data ->> 'username'), ''), split_part(coalesce(u.email, ''), '@', 1), 'user'), '[^a-z0-9_]+', '', 'g')), ''),
      'user'
    ),
    18
  ) || '_' || substr(replace(u.id::text, '-', ''), 1, 12),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'picture'), ''),
    null
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "rooms_update_admin" on public.rooms;
create policy "rooms_update_admin"
on public.rooms
for update
to authenticated
using (owner_id = auth.uid() or public.has_room_role(id, array['owner', 'admin']))
with check (owner_id = auth.uid() or public.has_room_role(id, array['owner', 'admin']));

drop policy if exists "rooms_delete_owner" on public.rooms;
create policy "rooms_delete_owner"
on public.rooms
for delete
to authenticated
using (owner_id = auth.uid() or public.has_room_role(id, array['owner']));
