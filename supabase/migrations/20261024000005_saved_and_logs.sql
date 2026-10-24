create table public.saved_places (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  place_id   uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
create index saved_places_user_idx on public.saved_places (user_id, created_at desc);

create table public.place_audit_log (
  id          bigint generated always as identity primary key,
  place_id    uuid references public.places(id) on delete set null,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,                 -- 'create' | 'update' | 'publish' | 'archive' | 'verify' | 'import'
  changes     jsonb,                         -- diff gọn các trường thay đổi
  created_at  timestamptz not null default now()
);
create index place_audit_place_idx on public.place_audit_log (place_id, created_at desc);

create table public.generation_events (
  id            bigint generated always as identity primary key,
  user_id       uuid references public.profiles(id) on delete set null,
  client_key    text not null,               -- băm (hash) của IP + user-agent, KHÔNG lưu IP thô
  is_guest      boolean not null,
  status        text not null check (status in ('success','fallback','error','rate_limited')),
  generated_by  text check (generated_by in ('llm','fallback')),
  llm_model     text,
  input_tokens  integer,
  output_tokens integer,
  duration_ms   integer,
  error_code    text,
  created_at    timestamptz not null default now()
);
create index generation_events_user_time_idx on public.generation_events (user_id, created_at desc);
create index generation_events_client_time_idx on public.generation_events (client_key, created_at desc);
