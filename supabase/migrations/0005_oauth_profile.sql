-- ============================================================
-- Harden profile auto-creation for OAuth (Google) + collision safety.
--  - handle: sanitized, deduped with a numeric suffix so a duplicate
--    local-part never breaks signup (the UNIQUE handle would otherwise
--    raise and abort the auth.users insert)
--  - display_name: email-signup meta, else Google name fields, else local part
--  - avatar_url: Google's avatar_url / picture when present
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  base_handle text;
  candidate text;
  suffix int := 0;
  dname text;
begin
  base_handle := lower(regexp_replace(
    coalesce(nullif(new.raw_user_meta_data ->> 'handle', ''), split_part(new.email, '@', 1), 'user'),
    '[^a-z0-9_]', '', 'g'));
  if base_handle is null or base_handle = '' then
    base_handle := 'user';
  end if;

  candidate := base_handle;
  while exists (select 1 from public.profiles where handle = candidate) loop
    suffix := suffix + 1;
    candidate := base_handle || suffix::text;
  end loop;

  dname := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1));

  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    candidate,
    dname,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
