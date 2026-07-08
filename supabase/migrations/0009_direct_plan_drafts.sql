-- ============================================================
-- Direct plan drafts.
-- A plan can now start from scratch, not only from copying a public route.
-- Such rows keep purpose='plan' with no original route.
-- ============================================================
alter table route_copies
  alter column original_route_id drop not null;

alter table route_copies
  drop constraint if exists route_copies_check;

alter table route_copies
  add constraint route_copies_original_not_self
  check (original_route_id is null or original_route_id <> copied_route_id);

drop policy if exists route_copies_read on route_copies;
create policy route_copies_read on route_copies
  for select using (
    copier_id = auth.uid()
    or (original_route_id is not null and private.owns_route(original_route_id))
  );

drop policy if exists route_copies_insert on route_copies;
create policy route_copies_insert on route_copies
  for insert with check (
    copier_id = auth.uid()
    and private.owns_route(copied_route_id)
    and (
      original_route_id is null
      or private.can_read_route(original_route_id)
    )
  );

drop policy if exists route_copies_delete on route_copies;
create policy route_copies_delete on route_copies
  for delete using (
    copier_id = auth.uid()
    or (original_route_id is not null and private.owns_route(original_route_id))
  );
