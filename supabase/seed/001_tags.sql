-- Baseline interest tags from docs/05-data-model.md §6.1.
insert into public.tags (slug, name, kind, sort_order) values
  ('heritage', 'Di sản & cung đình', 'interest', 1),
  ('history', 'Lịch sử & lăng tẩm', 'interest', 2),
  ('spiritual', 'Chùa chiền & tâm linh', 'interest', 3),
  ('river', 'Sông Hương & ngắm cảnh', 'interest', 4),
  ('cuisine', 'Ẩm thực Huế', 'interest', 5),
  ('cafe', 'Cà phê & thư giãn', 'interest', 6),
  ('photography', 'Chụp ảnh & check-in', 'interest', 7),
  ('nature', 'Thiên nhiên & ngoại ô', 'interest', 8),
  ('local-life', 'Đời sống địa phương', 'interest', 9),
  ('shopping', 'Quà & mua sắm', 'interest', 10)
on conflict (slug) do nothing;
