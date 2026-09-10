alter table public.profiles add column if not exists requested_course_id uuid references public.courses(id) on delete set null;
alter table public.teachers add column if not exists subject_course_id uuid references public.courses(id) on delete set null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare desired_role text; requested_course uuid;
begin
 desired_role := coalesce(new.raw_user_meta_data ->> 'requested_role','student');
 begin requested_course := nullif(new.raw_user_meta_data ->> 'requested_course_id','')::uuid; exception when others then requested_course := null; end;
 insert into public.profiles (id,full_name,role,phone,requested_role,status,requested_course_id)
 values (new.id,coalesce(new.raw_user_meta_data ->> 'full_name','New User'),'student',new.raw_user_meta_data ->> 'phone',
 case when desired_role in ('teacher','teacher_pending') then 'teacher_pending' else 'student' end,
 case when desired_role in ('teacher','teacher_pending') then 'pending' else 'active' end,requested_course) on conflict (id) do nothing;
 insert into public.students (id,status) values (new.id,case when desired_role in ('teacher','teacher_pending') then 'pending' else 'active' end) on conflict (id) do nothing;
 return new;
end;$$;

create or replace function public.approve_teacher(target_user_id uuid)
returns void language plpgsql security invoker as $$
declare requested_course uuid;
begin
 if not exists (select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Only admins can approve teachers'; end if;
 select requested_course_id into requested_course from public.profiles where id=target_user_id and requested_role='teacher_pending' and status='pending';
 if not found then raise exception 'Pending teacher application not found'; end if;
 update public.profiles set role='teacher',requested_role='teacher',status='active' where id=target_user_id;
 insert into public.teachers(id,status,subject_course_id) values(target_user_id,'active',requested_course)
 on conflict (id) do update set status='active',subject_course_id=excluded.subject_course_id;
end;$$;