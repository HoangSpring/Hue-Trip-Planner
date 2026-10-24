-- Bucket ảnh địa điểm: công khai đọc, chỉ admin ghi
insert into storage.buckets (id, name, public)
values ('place-images', 'place-images', true)
on conflict (id) do nothing;

create policy "place-images: ai cũng đọc" on storage.objects
  for select using (bucket_id = 'place-images');

create policy "place-images: admin ghi" on storage.objects
  for insert with check (bucket_id = 'place-images' and public.is_admin());
create policy "place-images: admin sửa" on storage.objects
  for update using (bucket_id = 'place-images' and public.is_admin());
create policy "place-images: admin xóa" on storage.objects
  for delete using (bucket_id = 'place-images' and public.is_admin());
