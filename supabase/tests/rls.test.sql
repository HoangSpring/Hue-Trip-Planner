begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(22);

-- Fixtures are inserted as the migration owner and rolled back at the end.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-user-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-user-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.trips (id, user_id, title, num_days, input)
values ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', 'RLS private trip', 1, '{}');
insert into public.trip_days (id, trip_id, day_index)
values ('c1000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', 1);

insert into public.places (id, slug, name, category, status)
values ('d0000000-0000-4000-8000-000000000004', 'rls-private-draft', 'RLS draft fixture', 'heritage', 'draft');

insert into public.place_audit_log (place_id, actor_id, action, changes)
values ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'update', '{}');
insert into public.trip_items (id, trip_day_id, trip_id, place_id, position, slot)
values ('c2000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003',
  'c0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000004', 0, 'morning');

select extensions.throws_ok(
  $$insert into public.trip_items (trip_day_id, trip_id, place_id, position, slot)
    values ('c1000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003',
      'd0000000-0000-4000-8000-000000000004', 1, 'afternoon')$$,
  '23505', null,
  'A place can only appear once in one trip'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (select count(*)::integer from public.trips where id = 'c0000000-0000-4000-8000-000000000003'),
  0,
  'User A cannot read a trip owned by user B'
);

select extensions.is(
  (select count(*)::integer from public.trip_days where id = 'c1000000-0000-4000-8000-000000000003'),
  0,
  'User A cannot read a day owned by user B'
);
select extensions.is(
  (with changed as (update public.trip_days set note = 'unauthorized'
    where id = 'c1000000-0000-4000-8000-000000000003' returning 1)
   select count(*)::integer from changed), 0,
  'User A cannot edit a day owned by user B'
);
select extensions.is(
  (with removed as (delete from public.trip_days
    where id = 'c1000000-0000-4000-8000-000000000003' returning 1)
   select count(*)::integer from removed), 0,
  'User A cannot delete a day owned by user B'
);
select extensions.is(
  (select count(*)::integer from public.trip_items where id = 'c2000000-0000-4000-8000-000000000003'),
  0,
  'User A cannot read an item owned by user B'
);
select extensions.is(
  (with changed as (update public.trip_items set note = 'unauthorized'
    where id = 'c2000000-0000-4000-8000-000000000003' returning 1)
   select count(*)::integer from changed), 0,
  'User A cannot edit an item owned by user B'
);
select extensions.is(
  (with removed as (delete from public.trip_items
    where id = 'c2000000-0000-4000-8000-000000000003' returning 1)
   select count(*)::integer from removed), 0,
  'User A cannot delete an item owned by user B'
);
select extensions.throws_ok(
  $$select public.save_trip('c0000000-0000-4000-8000-000000000003', '{"numDays":1,"days":[]}', now())$$,
  'PT404', 'TRIP_NOT_FOUND',
  'User A cannot call save_trip for user B trip'
);

select extensions.is(
  (select (public.create_trip_from_payload('{"clientDraftId":"e0000000-0000-4000-8000-000000000005","title":"Idempotent","numDays":1,"input":{},"generatedBy":"fallback","days":[]}')->>'created')::boolean),
  true,
  'First create_trip_from_payload call creates the trip'
);
select extensions.is(
  (select (public.create_trip_from_payload('{"clientDraftId":"e0000000-0000-4000-8000-000000000005","title":"Idempotent","numDays":1,"input":{},"generatedBy":"fallback","days":[]}')->>'created')::boolean),
  false,
  'Second create_trip_from_payload call returns existing trip'
);
select extensions.is(
  (select count(*)::integer from public.trips
   where user_id = 'a0000000-0000-4000-8000-000000000001'
     and client_draft_id = 'e0000000-0000-4000-8000-000000000005'),
  1,
  'Idempotency key creates only one row'
);
select extensions.throws_ok(
  $$select public.save_trip((select id from public.trips where client_draft_id = 'e0000000-0000-4000-8000-000000000005'), '{"numDays":1,"days":[]}', '2000-01-01T00:00:00Z'::timestamptz)$$,
  'PT409', 'TRIP_VERSION_CONFLICT',
  'save_trip rejects a stale expected_updated_at'
);
select set_config('app.max_trips_per_user', '1', true);
select extensions.throws_ok(
  $$select public.create_trip_from_payload('{"clientDraftId":"e1000000-0000-4000-8000-000000000005","title":"Over the limit","numDays":1,"input":{},"generatedBy":"fallback","days":[]}')$$,
  'PT422', 'MAX_TRIPS_PER_USER',
  'create_trip_from_payload enforces configured trip limit'
);

select extensions.is(
  (with changed as (
    update public.trips set title = 'unauthorized edit'
    where id = 'c0000000-0000-4000-8000-000000000003'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'User A cannot edit a trip owned by user B'
);

select extensions.is(
  (with removed as (
    delete from public.trips
    where id = 'c0000000-0000-4000-8000-000000000003'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'User A cannot delete a trip owned by user B'
);

select extensions.throws_ok(
  $$update public.profiles set role = 'admin' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'P0001', 'Không được phép thay đổi vai trò',
  'Regular user cannot promote their own profile to admin'
);

select extensions.is(
  (select count(*)::integer from public.place_audit_log),
  0,
  'Regular user cannot read place audit logs'
);

select extensions.is(
  (select count(*)::integer from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'),
  1,
  'Auth user insert trigger creates the matching profile'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select extensions.is(
  (select count(*)::integer from public.places where id = 'd0000000-0000-4000-8000-000000000004'),
  0,
  'Anonymous users cannot read draft places'
);

select extensions.throws_ok(
  $$insert into public.places (slug, name, category) values ('rls-guest-write', 'RLS test', 'heritage')$$,
  '42501', null,
  'Anonymous users cannot write places'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.throws_ok(
  $$insert into public.places (slug, name, category) values ('rls-user-write', 'RLS test', 'heritage')$$,
  '42501', null,
  'Regular users cannot write places'
);

reset role;
select * from extensions.finish();
rollback;
