-- RPCs used by authenticated trip APIs. These functions run as the caller so
-- the existing trips/trip_days/trip_items RLS policies remain in force.

create or replace function public.create_trip_from_payload(p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip public.trips;
  v_day jsonb;
  v_item jsonb;
  v_day_id uuid;
  v_draft_id uuid := nullif(p_payload->>'clientDraftId', '')::uuid;
  v_max_trips integer := coalesce(nullif(current_setting('app.max_trips_per_user', true), '')::integer, 50);
begin
  if v_user_id is null then
    raise exception using errcode = 'PT401', message = 'TRIP_AUTH_REQUIRED';
  end if;

  if v_draft_id is not null then
    select * into v_trip from public.trips
    where user_id = v_user_id and client_draft_id = v_draft_id;
    if found then return jsonb_build_object('id', v_trip.id, 'created', false); end if;
  end if;

  if (select count(*) from public.trips where user_id = v_user_id) >= v_max_trips then
    raise exception using errcode = 'PT422', message = 'MAX_TRIPS_PER_USER';
  end if;

  begin
    insert into public.trips (
      user_id, client_draft_id, title, start_date, num_days, input, generated_by,
      llm_model, start_lat, start_lng, start_label, is_shared, share_token
    ) values (
      v_user_id, v_draft_id, coalesce(nullif(btrim(p_payload->>'title'), ''), 'Chuyến đi Huế'),
      nullif(p_payload->>'startDate', '')::date, (p_payload->>'numDays')::smallint,
      p_payload->'input', coalesce(p_payload->>'generatedBy', 'fallback'),
      nullif(p_payload->>'llmModel', ''),
      nullif(p_payload#>>'{start,lat}', '')::double precision,
      nullif(p_payload#>>'{start,lng}', '')::double precision,
      nullif(p_payload#>>'{start,label}', ''), false, null
    ) returning * into v_trip;

    for v_day in select value from jsonb_array_elements(coalesce(p_payload->'days', '[]'::jsonb)) loop
      insert into public.trip_days (id, trip_id, day_index, date, note)
      values (
        (v_day->>'id')::uuid, v_trip.id, (v_day->>'dayIndex')::smallint,
        nullif(v_day->>'date', '')::date, nullif(v_day->>'note', '')
      ) returning id into v_day_id;

      for v_item in select value from jsonb_array_elements(coalesce(v_day->'items', '[]'::jsonb)) loop
        insert into public.trip_items (
          id, trip_day_id, trip_id, place_id, position, slot, start_time,
          duration_min, travel_min_from_prev, travel_distance_m, reason, note,
          is_locked, added_by
        ) values (
          (v_item->>'id')::uuid, v_day_id, v_trip.id, (v_item->>'placeId')::uuid,
          (v_item->>'position')::integer, v_item->>'slot',
          nullif(v_item->>'startTime', '')::time, nullif(v_item->>'durationMin', '')::integer,
          nullif(v_item->>'travelMinFromPrev', '')::integer,
          nullif(v_item->>'travelDistanceM', '')::integer, nullif(v_item->>'reason', ''),
          nullif(v_item->>'note', ''), coalesce((v_item->>'isLocked')::boolean, false),
          coalesce(v_item->>'addedBy', 'fallback')
        );
      end loop;
    end loop;
    return jsonb_build_object('id', v_trip.id, 'created', true);
  exception when unique_violation then
    if v_draft_id is not null then
      select * into v_trip from public.trips
      where user_id = v_user_id and client_draft_id = v_draft_id;
      if found then return jsonb_build_object('id', v_trip.id, 'created', false); end if;
    end if;
    raise;
  end;
end;
$$;

create or replace function public.save_trip(
  p_trip_id uuid,
  p_payload jsonb,
  p_expected_updated_at timestamptz
)
returns public.trips
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip public.trips;
  v_day jsonb;
  v_item jsonb;
  v_day_id uuid;
  v_item_ids uuid[] := array[]::uuid[];
  v_day_ids uuid[] := array[]::uuid[];
begin
  if v_user_id is null then
    raise exception using errcode = 'PT401', message = 'TRIP_AUTH_REQUIRED';
  end if;

  select * into v_trip from public.trips where id = p_trip_id for update;
  if not found then
    raise exception using errcode = 'PT404', message = 'TRIP_NOT_FOUND';
  end if;
  
  -- So sánh thời gian theo mili-giây để tránh lệch micro-giây với JavaScript .toISOString()
  if date_trunc('millisecond', v_trip.updated_at) <> date_trunc('millisecond', p_expected_updated_at) then
    raise exception using errcode = 'PT409', message = 'TRIP_VERSION_CONFLICT';
  end if;

  if (p_payload->>'numDays')::smallint <> v_trip.num_days then
    raise exception using errcode = 'PT422', message = 'TRIP_NUM_DAYS_IMMUTABLE';
  end if;

  select coalesce(array_agg((value->>'id')::uuid), array[]::uuid[]) into v_day_ids
  from jsonb_array_elements(coalesce(p_payload->'days', '[]'::jsonb));
  select coalesce(array_agg((item->>'id')::uuid), array[]::uuid[]) into v_item_ids
  from jsonb_array_elements(coalesce(p_payload->'days', '[]'::jsonb)) d(value)
  cross join lateral jsonb_array_elements(coalesce(d.value->'items', '[]'::jsonb)) i(item);

  delete from public.trip_items where trip_id = p_trip_id and not (id = any(v_item_ids));

  for v_day in select value from jsonb_array_elements(coalesce(p_payload->'days', '[]'::jsonb)) loop
    v_day_id := (v_day->>'id')::uuid;
    insert into public.trip_days (id, trip_id, day_index, date, note)
    values (v_day_id, p_trip_id, (v_day->>'dayIndex')::smallint,
      nullif(v_day->>'date', '')::date, nullif(v_day->>'note', ''))
    on conflict (id) do update set
      day_index = excluded.day_index, date = excluded.date, note = excluded.note
    where public.trip_days.trip_id = p_trip_id;

    for v_item in select value from jsonb_array_elements(coalesce(v_day->'items', '[]'::jsonb)) loop
      insert into public.trip_items (
        id, trip_day_id, trip_id, place_id, position, slot, start_time,
        duration_min, travel_min_from_prev, travel_distance_m, reason, note,
        is_locked, added_by
      ) values (
        (v_item->>'id')::uuid, v_day_id, p_trip_id, (v_item->>'placeId')::uuid,
        (v_item->>'position')::integer, v_item->>'slot',
        nullif(v_item->>'startTime', '')::time, nullif(v_item->>'durationMin', '')::integer,
        nullif(v_item->>'travelMinFromPrev', '')::integer,
        nullif(v_item->>'travelDistanceM', '')::integer, nullif(v_item->>'reason', ''),
        nullif(v_item->>'note', ''), coalesce((v_item->>'isLocked')::boolean, false),
        coalesce(v_item->>'addedBy', 'user')
      ) on conflict (id) do update set
        trip_day_id = excluded.trip_day_id, trip_id = excluded.trip_id,
        place_id = excluded.place_id, position = excluded.position, slot = excluded.slot,
        start_time = excluded.start_time, duration_min = excluded.duration_min,
        travel_min_from_prev = excluded.travel_min_from_prev,
        travel_distance_m = excluded.travel_distance_m, reason = excluded.reason,
        note = excluded.note, is_locked = excluded.is_locked, added_by = excluded.added_by
      where public.trip_items.trip_id = p_trip_id;
    end loop;
  end loop;

  delete from public.trip_days where trip_id = p_trip_id and not (id = any(v_day_ids));
  update public.trips set
    title = coalesce(nullif(btrim(p_payload->>'title'), ''), title),
    start_date = nullif(p_payload->>'startDate', '')::date
  where id = p_trip_id returning * into v_trip;
  return v_trip;
end;
$$;

revoke all on function public.create_trip_from_payload(jsonb) from public, anon;
grant execute on function public.create_trip_from_payload(jsonb) to authenticated;
revoke all on function public.save_trip(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.save_trip(uuid, jsonb, timestamptz) to authenticated;

-- Owners must be able to hydrate archived places already present in their trip.
create policy "places: archived in owned trips" on public.places
  for select using (
    status = 'archived' and exists (
      select 1
      from public.trip_items ti
      join public.trips t on t.id = ti.trip_id
      where ti.place_id = places.id and t.user_id = auth.uid()
    )
  );