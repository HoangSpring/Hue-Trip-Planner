create table public.trips (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  client_draft_id  uuid,                       -- chống tạo trùng khi đồng bộ bản nháp (FL-03)
  title            text not null default 'Chuyến đi Huế',
  start_date       date,
  num_days         smallint not null check (num_days between 1 and 5),
  input            jsonb not null,             -- toàn bộ dữ liệu wizard (đã qua Zod), xem mục 7
  generated_by     text not null default 'manual'
                     check (generated_by in ('llm','fallback','manual')),
  llm_model        text,
  start_lat        double precision,
  start_lng        double precision,
  start_label      text,
  is_shared        boolean not null default false,
  share_token      text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint trips_share_consistent
    check ((is_shared = false) or (share_token is not null))
);

create unique index trips_user_client_draft_uidx
  on public.trips (user_id, client_draft_id) where client_draft_id is not null;
create index trips_user_updated_idx on public.trips (user_id, updated_at desc);

create trigger trg_trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create table public.trip_days (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  day_index   smallint not null check (day_index between 1 and 5),  -- 1-based
  date        date,
  note        text check (char_length(note) <= 300),
  created_at  timestamptz not null default now(),
  unique (trip_id, day_index)
);

create table public.trip_items (
  id                  uuid primary key default gen_random_uuid(),
  trip_day_id         uuid not null references public.trip_days(id) on delete cascade,
  trip_id             uuid not null references public.trips(id) on delete cascade, -- phi chuẩn hóa để ràng buộc không trùng
  place_id            uuid not null references public.places(id) on delete restrict,
  position            integer not null check (position >= 0),   -- thứ tự trong ngày
  slot                text not null check (slot in ('morning','noon','afternoon','evening')),
  start_time          time,
  duration_min        integer check (duration_min between 5 and 600),
  travel_min_from_prev integer check (travel_min_from_prev >= 0),
  travel_distance_m   integer check (travel_distance_m >= 0),
  reason              text,                                      -- lý do gợi ý (AI/fallback)
  note                text check (char_length(note) <= 300),
  is_locked           boolean not null default false,            -- giữ nguyên khi tạo lại ngày
  added_by            text not null default 'user' check (added_by in ('ai','fallback','user')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (trip_id, place_id)                                     -- không lặp địa điểm trong cùng chuyến đi
);

create index trip_items_day_pos_idx on public.trip_items (trip_day_id, position);
create index trip_items_place_idx on public.trip_items (place_id);

create trigger trg_trip_items_updated_at
  before update on public.trip_items
  for each row execute function public.set_updated_at();

-- Bảo đảm trip_items.trip_id khớp với trip_days.trip_id
create or replace function public.check_trip_item_consistency()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.trip_days d
    where d.id = new.trip_day_id and d.trip_id = new.trip_id
  ) then
    raise exception 'trip_items.trip_id không khớp trip_days.trip_id';
  end if;
  return new;
end;
$$;

create trigger trg_trip_items_consistency
  before insert or update on public.trip_items
  for each row execute function public.check_trip_item_consistency();
