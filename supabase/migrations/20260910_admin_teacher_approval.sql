-- Teacher approval workflow.
-- Only an existing admin may approve or reject teacher applicants.

create or replace function public.approve_teacher(target_user_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can approve teachers';
  end if;

  update public.profiles
  set role = 'teacher',
      requested_role = 'teacher',
      status = 'active'
  where id = target_user_id
    and requested_role = 'teacher_pending'
    and status = 'pending';

  if not found then
    raise exception 'Pending teacher application not found';
  end if;
end;
$$;

create or replace function public.reject_teacher(target_user_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can reject teachers';
  end if;

  update public.profiles
  set requested_role = 'teacher',
      status = 'rejected'
  where id = target_user_id
    and requested_role = 'teacher_pending'
    and status = 'pending';

  if not found then
    raise exception 'Pending teacher application not found';
  end if;
end;
$$;

revoke all on function public.approve_teacher(uuid) from public;
revoke all on function public.reject_teacher(uuid) from public;
grant execute on function public.approve_teacher(uuid) to authenticated;
grant execute on function public.reject_teacher(uuid) to authenticated;