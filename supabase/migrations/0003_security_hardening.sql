-- ============================================================
-- Security hardening (clears Supabase advisor warnings)
--  1. public bucket: drop broad SELECT policy (prevents file listing;
--     public buckets still serve objects by URL)
--  2. revoke EXECUTE on trigger-only functions (removes RPC surface)
--  3. move RLS helper functions to a non-exposed `private` schema
-- ============================================================
drop policy "route photos: public read" on storage.objects;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.bump_route_counter() from anon, authenticated, public;

create schema if not exists private;

drop policy spots_read on spots;
drop policy spots_write on spots;
drop policy legs_read on legs;
drop policy legs_write on legs;
drop policy spot_photos_read on spot_photos;
drop policy spot_photos_write on spot_photos;
drop policy likes_read on likes;

drop function public.can_read_route(uuid);
drop function public.owns_route(uuid);

create function private.can_read_route(r_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from routes r where r.id = r_id and (r.visibility = 'public' or r.author_id = auth.uid()));
$$;

create function private.owns_route(r_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from routes r where r.id = r_id and r.author_id = auth.uid());
$$;

grant execute on function private.can_read_route(uuid) to anon, authenticated;
grant execute on function private.owns_route(uuid) to authenticated;

create policy spots_read on spots for select using (private.can_read_route(route_id));
create policy spots_write on spots for all using (private.owns_route(route_id)) with check (private.owns_route(route_id));
create policy legs_read on legs for select using (private.can_read_route(route_id));
create policy legs_write on legs for all using (private.owns_route(route_id)) with check (private.owns_route(route_id));
create policy spot_photos_read on spot_photos for select using (private.can_read_route((select route_id from spots where id = spot_id)));
create policy spot_photos_write on spot_photos for all using (private.owns_route((select route_id from spots where id = spot_id))) with check (private.owns_route((select route_id from spots where id = spot_id)));
create policy likes_read on likes for select using (private.can_read_route(route_id));
