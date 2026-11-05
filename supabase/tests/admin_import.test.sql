begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(9);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('f0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'import-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('f0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'import-user@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

select set_config('request.jwt.claim.sub', '', true);
update public.profiles set role = 'admin' where id = 'f0000000-0000-4000-8000-000000000001';
insert into public.tags (slug, name, kind) values ('rls-import-tag', 'RLS import tag', 'interest') on conflict (slug) do nothing;
create temporary table import_payload(row jsonb);
grant select, update on import_payload to authenticated;
insert into import_payload values ('{
  "slug":"rls-atomic-import-place","name":"Import ban đầu","category":"heritage",
  "short_description":"Mô tả kiểm thử","description":null,"address":null,"area":"Huế",
  "lat":16.46,"lng":107.59,"open_time":"08:00","close_time":"17:00","closed_days":[],
  "opening_note":null,"visit_duration_min":60,"price_level":null,"ticket_price_vnd":null,"price_note":null,
  "best_time":[],"meal_type":[],"suitable_for":[],"walking_intensity":null,
  "phone":null,"website":null,"cover_image_url":"https://example.test/rls.jpg",
  "image_credit":"Test author","image_license":"CC BY 4.0","image_source_url":null,
  "source":"csv-import","source_url":null,"featured":false,"status":"draft","verified":false,"tags":[]
}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select extensions.throws_ok(
  $$select public.admin_import_place((select row from import_payload), false)$$,
  '42501', null,
  'Non-admin cannot call admin_import_place'
);

reset role;
select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  (public.admin_import_place((select row from import_payload), false)->>'action'),
  'created', 'Admin import creates a new draft'
);
select extensions.is(
  (select status = 'draft' and verified = false from public.places where slug = 'rls-atomic-import-place'),
  true, 'New imported place starts draft and unverified'
);

update import_payload set row = jsonb_set(row, '{tags}', '[{"slug":"rls-import-tag","weight":2}]'::jsonb);
select extensions.is(
  (public.admin_import_place((select row from import_payload), false)->>'action'),
  'updated', 'Existing unverified place is updated atomically'
);
select extensions.is(
  (select count(*)::integer from public.place_tags pt join public.places p on p.id = pt.place_id where p.slug = 'rls-atomic-import-place'),
  1, 'Non-empty import tags replace the current tag set'
);

update public.places set status = 'published', verified = true where slug = 'rls-atomic-import-place';
update import_payload set row = jsonb_set(row, '{name}', '"Import ghi đè"'::jsonb);
select extensions.is(
  (public.admin_import_place((select row from import_payload), false)->>'action'),
  'skipped', 'Verified place is skipped without explicit overwrite'
);
select extensions.is(
  (public.admin_import_place((select row from import_payload), true)->>'action'),
  'updated', 'Verified place can be overwritten only with explicit opt-in'
);
select extensions.is(
  (select status = 'published' and verified = true and name = 'Import ghi đè' from public.places where slug = 'rls-atomic-import-place'),
  true, 'Overwrite preserves lifecycle status and verified flag'
);
select extensions.is(
  (select count(*)::integer from public.place_audit_log where place_id = (select id from public.places where slug = 'rls-atomic-import-place') and action = 'import'),
  3, 'Each created or updated import is audited; skipped row is not audited'
);

reset role;
select * from extensions.finish();
rollback;
