create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Hàm unaccent "immutable" để dùng trong index tìm kiếm tiếng Việt không dấu
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
as $$ select extensions.unaccent('extensions.unaccent', $1) $$;

-- Tự cập nhật updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
