-- Allow trusted SQL Editor/service-role updates while preventing JWT users from
-- changing their own role unless the caller's profile is already an admin.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Không được phép thay đổi vai trò';
  end if;
  return new;
end;
$$;
