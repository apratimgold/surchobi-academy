-- Keep Auth signups and public profiles/directories in sync.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  desired_role text;
begin
  desired_role := coalesce(new.raw_user_meta_data ->> 'requested_role','student');

  insert into public.profiles (id,full_name,role,phone,requested_role,status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name','New User'),
    'student',
    new.raw_user_meta_data ->> 'phone',
    case when desired_role in ('teacher','teacher_pending') then 'teacher_pending' else 'student' end,
    case when desired_role in ('teacher','teacher_pending') then 'pending' else 'active' end
  )
  on conflict (id) do nothing;

  insert into public.students (id,status)
  values (new.id,case when desired_role in ('teacher','teacher_pending') then 'pending' else 'active' end)
  on conflict (id) do nothing;

  return new;
end;
$$;