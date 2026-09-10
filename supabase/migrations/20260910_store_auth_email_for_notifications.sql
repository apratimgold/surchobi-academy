alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare desired_role text; requested_course uuid;
begin
 desired_role := coalesce(new.raw_user_meta_data ->> 'requested_role','student');
 begin requested_course := nullif(new.raw_user_meta_data ->> 'requested_course_id','')::uuid; exception when others then requested_course := null; end;
 insert into public.profiles (id,full_name,email,role,phone,requested_role,status,requested_course_id)
 values (new.id,coalesce(new.raw_user_meta_data ->> 'full_name','New User'),new.email,'student',
 new.raw_user_meta_data ->> 'phone',
 case when desired_role in ('teacher','teacher_pending') then 'teacher_pending' else 'student' end,
 case when desired_role in ('teacher','teacher_pending') then 'pending' else 'active' end,requested_course)
 on conflict (id) do update set email=excluded.email where public.profiles.email is null;
 insert into public.students (id,status) values(new.id,case when desired_role in ('teacher','teacher_pending') then 'pending' else 'active' end) on conflict (id) do nothing;
 return new;
end;
$$;

update public.profiles p set email=u.email from auth.users u where p.id=u.id and p.email is null;