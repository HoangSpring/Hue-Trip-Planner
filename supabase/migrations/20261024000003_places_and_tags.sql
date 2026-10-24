create table public.places (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique
                        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                text not null,
  category            text not null
                        check (category in ('heritage','food','cafe','sightseeing','shopping')),
  short_description   text,
  description         text,

  -- Vị trí
  address             text,
  area                text,                       -- khu vực/phường, dùng để gom cụm đơn giản
  lat                 double precision check (lat between -90 and 90),
  lng                 double precision check (lng between -180 and 180),

  -- Giờ giấc
  open_time           time,
  close_time          time,
  closed_days         smallint[] not null default '{}'
                        check (closed_days <@ array[1,2,3,4,5,6,7]::smallint[]),
  opening_note        text,                       -- ví dụ "Đóng cửa dịp lễ"

  -- Chi phí & đặc điểm
  visit_duration_min  integer check (visit_duration_min between 5 and 600),
  price_level         smallint check (price_level between 0 and 3),
  ticket_price_vnd    integer check (ticket_price_vnd >= 0),
  price_note          text,
  best_time           text[] not null default '{}'
                        check (best_time <@ array['morning','noon','afternoon','evening']),
  meal_type           text[] not null default '{}'
                        check (meal_type <@ array['breakfast','lunch','dinner','snack']),
  suitable_for        text[] not null default '{}'
                        check (suitable_for <@ array['solo','couple','family_kids','friends','seniors']),
  walking_intensity   smallint check (walking_intensity between 1 and 3),

  -- Liên hệ
  phone               text,
  website             text,

  -- Ảnh bìa (ảnh phụ ở bảng place_images)
  cover_image_url     text,
  cover_image_alt     text,
  image_credit        text,
  image_license       text,
  image_source_url    text,

  -- Nguồn dữ liệu
  source              text,                       -- 'manual' | 'osm' | 'csv' | ...
  source_url          text,
  osm_id              text,
  google_place_id     text,                       -- chỉ lưu ID, KHÔNG lưu nội dung Google

  -- Hiển thị & kiểm duyệt
  featured            boolean not null default false,
  sort_order          integer not null default 0,
  status              text not null default 'draft'
                        check (status in ('draft','published','archived')),
  verified            boolean not null default false,
  verified_by         uuid references public.profiles(id) on delete set null,
  verified_at         timestamptz,
  last_verified_at    timestamptz,                -- lần cuối thông tin giờ/giá được đối chiếu
  ai_filled_fields    text[] not null default '{}', -- các trường do AI điền, chưa chắc đúng

  -- Tìm kiếm không dấu
  search_text         text generated always as (
                        public.f_unaccent(lower(
                          coalesce(name,'') || ' ' || coalesce(address,'') || ' ' || coalesce(area,'')
                        ))
                      ) stored,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Ràng buộc nghiệp vụ
  constraint places_open_close_ok
    check ((open_time is null and close_time is null) or (open_time is not null and close_time is not null)),
  constraint places_published_requires_core
    check (
      status <> 'published' or (
        lat is not null and lng is not null
        and short_description is not null
        and cover_image_url is not null
        and visit_duration_min is not null
      )
    ),
  constraint places_image_credit_required
    check (cover_image_url is null or (image_credit is not null and image_license is not null))
);

create index places_status_category_idx on public.places (status, category);
create index places_featured_idx on public.places (featured) where status = 'published';
create index places_search_trgm_idx on public.places using gin (search_text extensions.gin_trgm_ops);
create index places_best_time_idx on public.places using gin (best_time);
create index places_suitable_idx on public.places using gin (suitable_for);

create trigger trg_places_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

create table public.place_images (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places(id) on delete cascade,
  url         text not null,
  alt         text,
  credit      text not null,
  license     text not null,
  source_url  text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index place_images_place_idx on public.place_images (place_id, sort_order);

create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  kind        text not null default 'interest' check (kind in ('interest','feature')),
  icon        text,                -- tên icon hoặc emoji hiển thị trong wizard
  image_url   text,                -- ảnh thẻ trong bước chọn sở thích
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.place_tags (
  place_id  uuid not null references public.places(id) on delete cascade,
  tag_id    uuid not null references public.tags(id) on delete cascade,
  weight    smallint not null default 1 check (weight between 1 and 3), -- độ liên quan, 3 = rất đúng chất
  primary key (place_id, tag_id)
);
create index place_tags_tag_idx on public.place_tags (tag_id);

create table public.start_points (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,        -- ví dụ "Trung tâm thành phố", "Gần Đại Nội"
  lat         double precision not null,
  lng         double precision not null,
  sort_order  integer not null default 0
);
