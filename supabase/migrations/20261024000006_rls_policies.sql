-- Bật RLS cho TẤT CẢ bảng
alter table public.profiles          enable row level security;
alter table public.places            enable row level security;
alter table public.place_images      enable row level security;
alter table public.tags              enable row level security;
alter table public.place_tags        enable row level security;
alter table public.start_points      enable row level security;
alter table public.trips             enable row level security;
alter table public.trip_days         enable row level security;
alter table public.trip_items        enable row level security;
alter table public.saved_places      enable row level security;
alter table public.place_audit_log   enable row level security;
alter table public.generation_events enable row level security;

-- profiles
create policy "profiles: đọc của mình hoặc admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: sửa của mình" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin sửa tất cả" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- places: công khai chỉ thấy published; admin thấy và ghi tất cả
create policy "places: đọc published" on public.places
  for select using (status = 'published' or public.is_admin());
create policy "places: admin ghi" on public.places
  for all using (public.is_admin()) with check (public.is_admin());

-- place_images
create policy "place_images: đọc theo địa điểm published" on public.place_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.places p where p.id = place_id and p.status = 'published'
    )
  );
create policy "place_images: admin ghi" on public.place_images
  for all using (public.is_admin()) with check (public.is_admin());

-- tags, place_tags, start_points: ai cũng đọc được, admin ghi
create policy "tags: đọc" on public.tags for select using (true);
create policy "tags: admin ghi" on public.tags
  for all using (public.is_admin()) with check (public.is_admin());

create policy "place_tags: đọc theo địa điểm published" on public.place_tags
  for select using (
    public.is_admin() or exists (
      select 1 from public.places p where p.id = place_id and p.status = 'published'
    )
  );
create policy "place_tags: admin ghi" on public.place_tags
  for all using (public.is_admin()) with check (public.is_admin());

create policy "start_points: đọc" on public.start_points for select using (true);
create policy "start_points: admin ghi" on public.start_points
  for all using (public.is_admin()) with check (public.is_admin());

-- trips: chỉ chủ sở hữu
create policy "trips: chủ sở hữu" on public.trips
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- trip_days: qua trips
create policy "trip_days: chủ sở hữu" on public.trip_days
  for all using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- trip_items: qua trips
create policy "trip_items: chủ sở hữu" on public.trip_items
  for all using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- saved_places
create policy "saved_places: chủ sở hữu" on public.saved_places
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- place_audit_log: admin chỉ đọc; ghi bằng service role (bỏ qua RLS)
create policy "audit: admin đọc" on public.place_audit_log
  for select using (public.is_admin());

-- generation_events: KHÔNG có policy nào => client không truy cập được;
-- chỉ service role (backend) đọc/ghi.
