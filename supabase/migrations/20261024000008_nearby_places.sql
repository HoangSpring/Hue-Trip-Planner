create or replace function public.nearby_places(
  p_lat double precision,
  p_lng double precision,
  p_limit integer default 5,
  p_exclude uuid[] default '{}'::uuid[]
)
returns table (
  id uuid,
  slug text,
  name text,
  category text,
  short_description text,
  area text,
  lat double precision,
  lng double precision,
  cover_image_url text,
  cover_image_alt text,
  image_credit text,
  image_license text,
  verified boolean,
  distance_m double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    place.id,
    place.slug,
    place.name,
    place.category,
    place.short_description,
    place.area,
    place.lat,
    place.lng,
    place.cover_image_url,
    place.cover_image_alt,
    place.image_credit,
    place.image_license,
    place.verified,
    distance.distance_m
  from public.places as place
  cross join lateral (
    select 6371000.0 * 2.0 * asin(sqrt(least(1.0, greatest(0.0,
      power(sin(radians(place.lat - p_lat) / 2.0), 2.0)
      + cos(radians(p_lat)) * cos(radians(place.lat))
        * power(sin(radians(place.lng - p_lng) / 2.0), 2.0)
    )))) as distance_m
  ) as distance
  where p_lat between -90 and 90
    and p_lng between -180 and 180
    and place.status = 'published'
    and place.lat is not null
    and place.lng is not null
    and not (place.id = any(coalesce(p_exclude, '{}'::uuid[])))
  order by distance.distance_m, place.slug
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

revoke all on function public.nearby_places(double precision, double precision, integer, uuid[]) from public;
grant execute on function public.nearby_places(double precision, double precision, integer, uuid[]) to anon, authenticated;
