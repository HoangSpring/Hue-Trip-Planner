-- Approximate city-centre result from OpenStreetMap Nominatim, queried 2026-10-24.
-- https://www.openstreetmap.org/ (© OpenStreetMap contributors). Confirm/edit with project owner before using for routing.
insert into public.start_points (slug, name, lat, lng, sort_order) values
  ('hue-city-centre', 'Trung tâm thành phố Huế', 16.4639321, 107.5863388, 1)
on conflict (slug) do nothing;
