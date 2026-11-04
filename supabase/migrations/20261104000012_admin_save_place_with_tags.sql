-- Keep place + tag replacement atomic while using the caller's JWT/RLS.
create or replace function public.admin_save_place_with_tags(p_place jsonb, p_tags jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_tag jsonb;
  v_tag_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_place) <> 'object' or jsonb_typeof(p_tags) <> 'array' then
    raise exception 'INVALID_PLACE_PAYLOAD' using errcode = '22023';
  end if;

  v_id := nullif(p_place ->> 'id', '')::uuid;
  if v_id is null then
    insert into public.places (
      slug, name, category, short_description, description, address, area, lat, lng,
      open_time, close_time, closed_days, opening_note, visit_duration_min, price_level,
      ticket_price_vnd, price_note, best_time, meal_type, suitable_for, walking_intensity,
      phone, website, cover_image_url, cover_image_alt, image_credit, image_license,
      image_source_url, source, source_url, osm_id, google_place_id, featured, sort_order, status
    ) values (
      p_place ->> 'slug', p_place ->> 'name', p_place ->> 'category', p_place ->> 'short_description',
      p_place ->> 'description', p_place ->> 'address', p_place ->> 'area',
      nullif(p_place ->> 'lat', '')::double precision, nullif(p_place ->> 'lng', '')::double precision,
      nullif(p_place ->> 'open_time', '')::time, nullif(p_place ->> 'close_time', '')::time,
      coalesce(array(select jsonb_array_elements_text(p_place -> 'closed_days')::smallint), '{}'),
      p_place ->> 'opening_note', nullif(p_place ->> 'visit_duration_min', '')::integer,
      nullif(p_place ->> 'price_level', '')::smallint, nullif(p_place ->> 'ticket_price_vnd', '')::integer,
      p_place ->> 'price_note',
      coalesce(array(select jsonb_array_elements_text(p_place -> 'best_time')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p_place -> 'meal_type')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p_place -> 'suitable_for')), '{}'),
      nullif(p_place ->> 'walking_intensity', '')::smallint, p_place ->> 'phone', p_place ->> 'website',
      p_place ->> 'cover_image_url', p_place ->> 'cover_image_alt', p_place ->> 'image_credit',
      p_place ->> 'image_license', p_place ->> 'image_source_url', p_place ->> 'source',
      p_place ->> 'source_url', p_place ->> 'osm_id', p_place ->> 'google_place_id',
      coalesce((p_place ->> 'featured')::boolean, false), coalesce((p_place ->> 'sort_order')::integer, 0),
      coalesce(p_place ->> 'status', 'draft')
    ) returning id into v_id;
  else
    update public.places set
      slug = p_place ->> 'slug', name = p_place ->> 'name', category = p_place ->> 'category',
      short_description = p_place ->> 'short_description', description = p_place ->> 'description',
      address = p_place ->> 'address', area = p_place ->> 'area',
      lat = nullif(p_place ->> 'lat', '')::double precision, lng = nullif(p_place ->> 'lng', '')::double precision,
      open_time = nullif(p_place ->> 'open_time', '')::time, close_time = nullif(p_place ->> 'close_time', '')::time,
      closed_days = coalesce(array(select jsonb_array_elements_text(p_place -> 'closed_days')::smallint), '{}'),
      opening_note = p_place ->> 'opening_note', visit_duration_min = nullif(p_place ->> 'visit_duration_min', '')::integer,
      price_level = nullif(p_place ->> 'price_level', '')::smallint,
      ticket_price_vnd = nullif(p_place ->> 'ticket_price_vnd', '')::integer, price_note = p_place ->> 'price_note',
      best_time = coalesce(array(select jsonb_array_elements_text(p_place -> 'best_time')), '{}'),
      meal_type = coalesce(array(select jsonb_array_elements_text(p_place -> 'meal_type')), '{}'),
      suitable_for = coalesce(array(select jsonb_array_elements_text(p_place -> 'suitable_for')), '{}'),
      walking_intensity = nullif(p_place ->> 'walking_intensity', '')::smallint,
      phone = p_place ->> 'phone', website = p_place ->> 'website', cover_image_url = p_place ->> 'cover_image_url',
      cover_image_alt = p_place ->> 'cover_image_alt', image_credit = p_place ->> 'image_credit',
      image_license = p_place ->> 'image_license', image_source_url = p_place ->> 'image_source_url',
      source = p_place ->> 'source', source_url = p_place ->> 'source_url', osm_id = p_place ->> 'osm_id',
      google_place_id = p_place ->> 'google_place_id', featured = coalesce((p_place ->> 'featured')::boolean, false),
      sort_order = coalesce((p_place ->> 'sort_order')::integer, 0), status = p_place ->> 'status'
    where id = v_id returning id into v_id;
    if v_id is null then raise exception 'PLACE_NOT_FOUND' using errcode = 'PT404'; end if;
  end if;

  delete from public.place_tags where place_id = v_id;
  for v_tag in select value from jsonb_array_elements(p_tags) loop
    select id into v_tag_id from public.tags where slug = v_tag ->> 'slug';
    if v_tag_id is null then raise exception 'TAG_NOT_FOUND' using errcode = '23503'; end if;
    insert into public.place_tags (place_id, tag_id, weight)
    values (v_id, v_tag_id, coalesce((v_tag ->> 'weight')::smallint, 1));
  end loop;
  return v_id;
end;
$$;

revoke all on function public.admin_save_place_with_tags(jsonb, jsonb) from public;
grant execute on function public.admin_save_place_with_tags(jsonb, jsonb) to authenticated;
