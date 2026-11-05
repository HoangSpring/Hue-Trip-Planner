-- Atomic import through the authenticated admin JWT: place, optional tags, and audit.
create policy "audit: admin ghi import"
  on public.place_audit_log for insert
  with check (public.is_admin() and action = 'import' and actor_id = auth.uid());

create or replace function public.admin_import_place(p_row jsonb, p_overwrite_verified boolean)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.places;
  v_existing public.places;
  v_place_id uuid;
  v_action text;
  v_reason text;
  v_tag jsonb;
  v_tag_id uuid;
  v_changed text[];
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_row) <> 'object' then
    raise exception 'INVALID_IMPORT_ROW' using errcode = '22023';
  end if;
  if p_row ? 'tags' and jsonb_typeof(p_row -> 'tags') <> 'array' then
    raise exception 'INVALID_IMPORT_TAGS' using errcode = '22023';
  end if;

  v_row := jsonb_populate_record(null::public.places, p_row - 'tags' - 'id' - 'search_text' - 'created_at' - 'updated_at');
  if v_row.slug is null or v_row.name is null or v_row.category is null then
    raise exception 'INVALID_IMPORT_ROW' using errcode = '22023';
  end if;

  -- Serialize imports for the same slug, including the first insert.
  perform pg_advisory_xact_lock(hashtextextended(v_row.slug, 0));
  select * into v_existing from public.places where slug = v_row.slug for update;
  if found and v_existing.verified and not p_overwrite_verified then
    return jsonb_build_object(
      'action', 'skipped', 'place_id', v_existing.id,
      'reason', 'Địa điểm đã verified và chưa bật ghi đè.'
    );
  end if;

  if not found then
    insert into public.places (
      slug, name, category, short_description, description, address, area, lat, lng,
      open_time, close_time, closed_days, opening_note, visit_duration_min, price_level,
      ticket_price_vnd, price_note, best_time, meal_type, suitable_for, walking_intensity,
      phone, website, cover_image_url, image_credit, image_license, image_source_url,
      source, source_url, featured, status, verified
    ) values (
      v_row.slug, v_row.name, v_row.category, v_row.short_description, v_row.description, v_row.address, v_row.area,
      v_row.lat, v_row.lng, v_row.open_time, v_row.close_time, v_row.closed_days, v_row.opening_note,
      v_row.visit_duration_min, v_row.price_level, v_row.ticket_price_vnd, v_row.price_note, v_row.best_time,
      v_row.meal_type, v_row.suitable_for, v_row.walking_intensity, v_row.phone, v_row.website,
      v_row.cover_image_url, v_row.image_credit, v_row.image_license, v_row.image_source_url,
      coalesce(v_row.source, 'csv-import'), v_row.source_url, coalesce(v_row.featured, false), 'draft', false
    ) returning id into v_place_id;
    v_action := 'created';
    v_changed := array(select key from jsonb_object_keys(p_row - 'tags' - 'status' - 'verified') as keys(key));
  else
    update public.places set
      name = v_row.name, category = v_row.category, short_description = v_row.short_description,
      description = v_row.description, address = v_row.address, area = v_row.area,
      lat = v_row.lat, lng = v_row.lng, open_time = v_row.open_time, close_time = v_row.close_time,
      closed_days = v_row.closed_days, opening_note = v_row.opening_note,
      visit_duration_min = v_row.visit_duration_min, price_level = v_row.price_level,
      ticket_price_vnd = v_row.ticket_price_vnd, price_note = v_row.price_note,
      best_time = v_row.best_time, meal_type = v_row.meal_type, suitable_for = v_row.suitable_for,
      walking_intensity = v_row.walking_intensity, phone = v_row.phone, website = v_row.website,
      cover_image_url = v_row.cover_image_url, image_credit = v_row.image_credit,
      image_license = v_row.image_license, image_source_url = v_row.image_source_url,
      source = coalesce(v_row.source, v_existing.source, 'csv-import'), source_url = v_row.source_url,
      featured = coalesce(v_row.featured, false)
    where id = v_existing.id returning id into v_place_id;
    v_action := 'updated';
    v_changed := array(
      select key from jsonb_each(p_row - 'tags' - 'status' - 'verified') as entry(key, value)
      where to_jsonb(v_existing) -> key is distinct from value
    );
  end if;

  if coalesce(p_row ? 'tags' and jsonb_array_length(p_row -> 'tags') > 0, false) then
    delete from public.place_tags where place_id = v_place_id;
    for v_tag in select value from jsonb_array_elements(p_row -> 'tags') loop
      select id into v_tag_id from public.tags where slug = v_tag ->> 'slug';
      if v_tag_id is null then raise exception 'TAG_NOT_FOUND' using errcode = '23503'; end if;
      insert into public.place_tags (place_id, tag_id, weight)
      values (v_place_id, v_tag_id, coalesce((v_tag ->> 'weight')::smallint, 1));
    end loop;
    v_changed := array_append(v_changed, 'tags');
  end if;

  insert into public.place_audit_log (place_id, actor_id, action, changes)
  values (v_place_id, auth.uid(), 'import', jsonb_build_object('changedFields', to_jsonb(v_changed)));

  return jsonb_build_object('action', v_action, 'place_id', v_place_id, 'reason', v_reason);
end;
$$;

revoke all on function public.admin_import_place(jsonb, boolean) from public;
grant execute on function public.admin_import_place(jsonb, boolean) to authenticated;
