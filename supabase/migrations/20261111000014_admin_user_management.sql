alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  target public.profiles%rowtype;
  admin_count integer;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('user', 'admin') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;

  -- Serialize demotions so two admins cannot concurrently remove the last admin.
  perform pg_advisory_xact_lock(hashtext('admin-profile-role-change'));
  select * into target from public.profiles where id = p_user_id for update;
  if not found then raise exception 'USER_NOT_FOUND' using errcode = 'PT404'; end if;
  if target.id = auth.uid() and target.role <> p_role then
    raise exception 'CANNOT_CHANGE_OWN_ROLE' using errcode = 'PT409';
  end if;
  if target.role = 'admin' and p_role = 'user' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count <= 1 then raise exception 'LAST_ADMIN_REQUIRED' using errcode = 'PT409'; end if;
  end if;

  update public.profiles set role = p_role where id = p_user_id;
  target.role := p_role;
  return jsonb_build_object('id', target.id, 'display_name', target.display_name, 'role', target.role, 'is_suspended', target.is_suspended);
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
