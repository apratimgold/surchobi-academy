-- Surchobi role-aware registration support.
-- Existing public sign-up remains a Student. Teacher applicants are pending until approved.

alter table public.profiles
  add column if not exists requested_role text,
  add column if not exists status text;

update public.profiles
set role = coalesce(role, 'student'),
    status = coalesce(status, 'active')
where role is null or status is null;

alter table public.profiles
  alter column role set default 'student',
  alter column status set default 'active';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student','teacher','admin'));

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active','pending','suspended'));

alter table public.profiles
  drop constraint if exists profiles_requested_role_check;

alter table public.profiles
  add constraint profiles_requested_role_check
  check (requested_role is null or requested_role in ('student','teacher_pending','teacher'));

-- Keep the public directory tables aligned with the profile role.
create or replace function public.sync_student_teacher_directory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'teacher' and new.status = 'active' then
    insert into public.teachers (id)
    values (new.id)
    on conflict (id) do nothing;
    delete from public.students where id = new.id;
  elsif new.role = 'student' and new.status = 'active' then
    insert into public.students (id)
    values (new.id)
    on conflict (id) do nothing;
    delete from public.teachers where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_student_teacher_directory on public.profiles;
create trigger trg_sync_student_teacher_directory
after insert or update of role, status on public.profiles
for each row execute function public.sync_student_teacher_directory();

-- New auth users are students by default. If the client explicitly requests a teacher
-- application, store that request as pending while keeping the actual role as student
-- until an admin approves it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := new.raw_user_meta_data->>'requested_role';
  full_name text := coalesce(new.raw_user_meta_data->>'full_name', '');
begin
  insert into public.profiles (id, full_name, role, requested_role, status)
  values (
    new.id,
    full_name,
    'student',
    case when requested = 'teacher_pending' then 'teacher_pending' else 'student' end,
    case when requested = 'teacher_pending' then 'pending' else 'active' end
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        requested_role = excluded.requested_role,
        status = excluded.status,
        role = case when public.profiles.role = 'admin' then 'admin' else excluded.role end;
  return new;
end;
$$;

-- Replace only the profile-creation trigger if a trigger with this common name exists.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Admin-only approval/rejection helpers. These functions intentionally refuse
-- non-admin callers through auth.uid().
create or replace function public.approve_teacher_application(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active') then
    raise exception 'Only an active admin can approve teacher applications';
  end if;
  update public.profiles
  set role = 'teacher', status = 'active', requested_role = 'teacher'
  where id = p_profile_id and requested_role = 'teacher_pending';
  return found;
end;
$$;

create or replace function public.reject_teacher_application(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active') then
    raise exception 'Only an active admin can reject teacher applications';
  end if;
  update public.profiles
  set role = 'student', status = 'active', requested_role = 'student'
  where id = p_profile_id and requested_role = 'teacher_pending';
  return found;
end;
$$;

grant execute on function public.approve_teacher_application(uuid) to authenticated;
grant execute on function public.reject_teacher_application(uuid) to authenticated;
