-- ============================================================
-- Demo loop seed (P2 · P4 showcase) — Wave F2
-- Idempotent. Requires auth user demo@course-sns.app.
-- Clones one public course into demo's private plan draft + follows the maker.
-- Run via: supabase db push  (or SQL editor on the project)
-- ============================================================

create or replace function private.seed_demo_loop()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_id uuid;
  src record;
  new_route_id uuid;
  old_spot record;
  new_spot_id uuid;
  id_map jsonb := '{}'::jsonb;
  leg record;
begin
  select id into demo_id from auth.users where email = 'demo@course-sns.app' limit 1;
  if demo_id is null then
    raise notice 'seed_demo_loop: demo@course-sns.app not found — skip';
    return;
  end if;

  -- Ensure profile row exists for demo
  insert into profiles (id, handle, display_name)
  values (demo_id, 'demo', '데모')
  on conflict (id) do nothing;

  -- Pick a public course not authored by demo
  select r.id, r.author_id, r.title, r.region, r.theme, r.recommended_for, r.best_season, r.est_cost_krw
    into src
  from routes r
  where r.visibility = 'public'
    and r.author_id <> demo_id
  order by r.created_at desc
  limit 1;

  if src.id is null then
    raise notice 'seed_demo_loop: no public course to clone — skip';
    return;
  end if;

  -- P4: follow the maker (ignore if already following)
  insert into follows (follower_id, followee_id)
  values (demo_id, src.author_id)
  on conflict do nothing;

  -- P2: skip if demo already has a copy of this original
  if exists (
    select 1 from route_copies c
    where c.copier_id = demo_id and c.original_route_id = src.id
  ) then
    raise notice 'seed_demo_loop: route_copy already exists — follow ensured';
    return;
  end if;

  insert into routes (
    author_id, title, region, theme, recommended_for, best_season, est_cost_krw, visibility
  ) values (
    demo_id,
    src.title || ' (따라가는 중)',
    coalesce(src.region, '서울'),
    src.theme,
    src.recommended_for,
    src.best_season,
    src.est_cost_krw,
    'private'
  )
  returning id into new_route_id;

  for old_spot in
    select * from spots s where s.route_id = src.id order by s.order_index
  loop
    insert into spots (route_id, order_index, title, body, address, lat, lng)
    values (
      new_route_id,
      old_spot.order_index,
      old_spot.title,
      '',
      coalesce(old_spot.address, ''),
      old_spot.lat,
      old_spot.lng
    )
    returning id into new_spot_id;
    id_map := id_map || jsonb_build_object(old_spot.id::text, new_spot_id::text);
  end loop;

  for leg in
    select * from legs l where l.route_id = src.id
  loop
    if id_map ? leg.from_spot_id::text and id_map ? leg.to_spot_id::text then
      insert into legs (route_id, from_spot_id, to_spot_id, transport, duration_min, caution)
      values (
        new_route_id,
        (id_map ->> leg.from_spot_id::text)::uuid,
        (id_map ->> leg.to_spot_id::text)::uuid,
        leg.transport,
        leg.duration_min,
        leg.caution
      );
    end if;
  end loop;

  insert into route_copies (original_route_id, copied_route_id, copier_id, purpose)
  values (src.id, new_route_id, demo_id, 'plan');

  raise notice 'seed_demo_loop: seeded copy % from % for demo', new_route_id, src.id;
end;
$$;

select private.seed_demo_loop();
