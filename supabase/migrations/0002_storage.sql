-- ============================================================
-- Storage: route photos
-- Path convention: <auth_uid>/<route_id>/<spot_id>/<filename>
-- Owners manage objects under their own uid folder. Read is public for the
-- prototype (photos are served by URL). Tighten to signed URLs for private
-- routes in a later phase.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('route-photos', 'route-photos', true)
on conflict (id) do nothing;

create policy "route photos: public read"
  on storage.objects for select
  using (bucket_id = 'route-photos');

create policy "route photos: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'route-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "route photos: owner update"
  on storage.objects for update
  using (
    bucket_id = 'route-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "route photos: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'route-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
