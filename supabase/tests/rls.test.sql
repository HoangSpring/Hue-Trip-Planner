begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(9);

-- Fixtures are inserted as the migration owner and rolled back at the end.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-user-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-user-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.trips (id, user_id, title, num_days, input)
values ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', 'RLS private trip', 1, '{}');

insert into public.places (id, slug, name, category, status)
values ('d0000000-0000-4000-8000-000000000004', 'rls-private-draft', 'RLS draft fixture', 'heritage', 'draft');

insert into public.place_audit_log (place_id, actor_id, action, changes)
values ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'update', '{}');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (select count(*)::integer from public.trips where id = 'c0000000-0000-4000-8000-000000000003'),
  0,
  'User A cannot read a trip owned by user B'
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
