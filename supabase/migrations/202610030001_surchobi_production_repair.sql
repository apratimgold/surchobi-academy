-- Surchobi production repair applied to live Supabase on 2026-10-03.
-- This migration is intentionally idempotent where practical and records the
-- production security/data-model state that the frontend now depends on.

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

create or replace function public.is_teacher_for_batch(p_batch_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.batches where id=p_batch_id and teacher_id=auth.uid()) $$;

create or replace function public.is_student_in_batch(p_batch_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.enrollments where batch_id=p_batch_id and student_id=auth.uid()) $$;

create or replace function public.is_teacher_assigned_to_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(
  select 1 from public.enrollments e join public.batches b on b.id=e.batch_id
  where e.student_id=p_student_id and b.teacher_id=auth.uid()
) $$;

revoke all on function public.is_teacher_for_batch(uuid) from public,anon,authenticated;
revoke all on function public.is_student_in_batch(uuid) from public,anon,authenticated;
revoke all on function public.is_teacher_assigned_to_student(uuid) from public,anon,authenticated;
grant execute on function public.is_teacher_for_batch(uuid) to authenticated;
grant execute on function public.is_student_in_batch(uuid) to authenticated;
grant execute on function public.is_teacher_assigned_to_student(uuid) to authenticated;

create or replace function public.update_my_profile(p_full_name text,p_phone text,p_avatar_url text default null)
returns boolean language plpgsql security definer set search_path=public
as $$ begin
  update public.profiles
  set full_name=left(trim(coalesce(p_full_name,'')),200),
      phone=nullif(left(trim(coalesce(p_phone,'')),40),''),
      avatar_url=nullif(left(trim(coalesce(p_avatar_url,'')),1000),'')
  where id=auth.uid();
  return found;
end; $$;
revoke all on function public.update_my_profile(text,text,text) from public,anon;
grant execute on function public.update_my_profile(text,text,text) to authenticated;

-- Registration trigger creates the correct directory relations from auth metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
 desired_role text:=coalesce(new.raw_user_meta_data->>'requested_role','student');
 requested_course uuid;
 requested_ids jsonb:=new.raw_user_meta_data->'requested_course_ids';
 item text;
begin
 begin requested_course:=nullif(new.raw_user_meta_data->>'requested_course_id','')::uuid;
 exception when others then requested_course:=null; end;

 insert into public.profiles(id,full_name,email,role,phone,requested_role,status,requested_course_id)
 values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'full_name',200),''),'New User'),new.email,'student',
   nullif(left(new.raw_user_meta_data->>'phone',40),''),
   case when desired_role in ('teacher','teacher_pending') then 'teacher_pending' else 'student' end,
   case when desired_role in ('teacher','teacher_pending') then 'pending' else 'active' end,
   requested_course)
 on conflict(id) do update
   set email=coalesce(public.profiles.email,excluded.email),
       full_name=coalesce(public.profiles.full_name,excluded.full_name),
       phone=coalesce(public.profiles.phone,excluded.phone),
       requested_course_id=coalesce(public.profiles.requested_course_id,excluded.requested_course_id);

 if desired_role in ('teacher','teacher_pending') then
   if jsonb_typeof(requested_ids)='array' then
     for item in select jsonb_array_elements_text(requested_ids) loop
       begin
         insert into public.teacher_course_requests(teacher_id,course_id)
         select new.id,item::uuid where exists(select 1 from public.courses where id=item::uuid)
         on conflict do nothing;
       exception when others then null; end;
     end loop;
   elsif requested_course is not null then
     insert into public.teacher_course_requests(teacher_id,course_id)
     select new.id,requested_course where exists(select 1 from public.courses where id=requested_course)
     on conflict do nothing;
   end if;
   delete from public.students where id=new.id;
 else
   insert into public.students(id,status) values(new.id,'active')
   on conflict(id) do update set status='active';
   if jsonb_typeof(requested_ids)='array' then
     for item in select jsonb_array_elements_text(requested_ids) loop
       begin
         insert into public.enrollments(student_id,course_id,batch_id,status)
         select new.id,item::uuid,null,'active'
         where exists(select 1 from public.courses where id=item::uuid)
         on conflict(student_id,course_id) do nothing;
       exception when others then null; end;
     end loop;
   elsif requested_course is not null then
     insert into public.enrollments(student_id,course_id,batch_id,status)
     select new.id,requested_course,null,'active'
     where exists(select 1 from public.courses where id=requested_course)
     on conflict(student_id,course_id) do nothing;
   end if;
 end if;
 return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.approve_teacher(target_user_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare legacy_course uuid;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin' and status='active')
   then raise exception 'Only active admins can approve teachers'; end if;
 select requested_course_id into legacy_course from public.profiles
 where id=target_user_id and requested_role='teacher_pending' and status='pending';
 if not found then raise exception 'Pending teacher application not found'; end if;
 if not exists(select 1 from public.teacher_course_requests where teacher_id=target_user_id) and legacy_course is not null then
   insert into public.teacher_course_requests(teacher_id,course_id)
   select target_user_id,legacy_course where exists(select 1 from public.courses where id=legacy_course)
   on conflict do nothing;
 end if;
 if not exists(select 1 from public.teacher_course_requests where teacher_id=target_user_id)
   then raise exception 'Teacher application has no selected course'; end if;
 update public.profiles set role='teacher',requested_role='teacher',status='active' where id=target_user_id;
 insert into public.teachers(id,status,subject_course_id) values(target_user_id,'active',legacy_course)
 on conflict(id) do update set status='active',subject_course_id=coalesce(excluded.subject_course_id,public.teachers.subject_course_id);
 insert into public.teacher_courses(teacher_id,course_id,status)
 select target_user_id,course_id,'active' from public.teacher_course_requests where teacher_id=target_user_id
 on conflict(teacher_id,course_id) do update set status='active';
 delete from public.students where id=target_user_id;
end; $$;

create or replace function public.reject_teacher(target_user_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin' and status='active')
   then raise exception 'Only active admins can reject teachers'; end if;
 update public.profiles set role='student',requested_role='teacher',status='rejected'
 where id=target_user_id and requested_role='teacher_pending' and status='pending';
 if not found then raise exception 'Pending teacher application not found'; end if;
 delete from public.teacher_course_requests where teacher_id=target_user_id;
 delete from public.teacher_courses where teacher_id=target_user_id;
end; $$;

revoke all on function public.approve_teacher(uuid) from public,anon;
revoke all on function public.reject_teacher(uuid) from public,anon;
grant execute on function public.approve_teacher(uuid) to authenticated;
grant execute on function public.reject_teacher(uuid) to authenticated;

delete from public.students s using public.profiles p where s.id=p.id and p.role='teacher';

drop view if exists public.public_faculty;
create view public.public_faculty with (security_invoker=false) as
select t.id,p.full_name,p.avatar_url,t.photo_url,t.specialization,t.bio,t.subject_course_id,
 coalesce(array_agg(distinct tc.course_id) filter(where tc.course_id is not null),'{}') course_ids,
 coalesce(array_agg(distinct c.name) filter(where c.name is not null),'{}') course_names
from public.teachers t join public.profiles p on p.id=t.id
left join public.teacher_courses tc on tc.teacher_id=t.id and tc.status='active'
left join public.courses c on c.id=tc.course_id
where t.status='active' and p.status='active'
group by t.id,p.full_name,p.avatar_url,t.photo_url,t.specialization,t.bio,t.subject_course_id;

drop view if exists public.approved_student_reviews;
create view public.approved_student_reviews with (security_invoker=false) as
select r.id,r.review,r.rating,r.created_at,p.full_name,p.avatar_url
from public.student_reviews r join public.profiles p on p.id=r.student_id
where r.approved=true and p.status='active';

drop view if exists public.public_stats;
create view public.public_stats with (security_invoker=false) as
select
 (select count(*) from public.students where status in ('active','approved'))::bigint students,
 (select count(*) from public.courses)::bigint courses,
 (select count(*) from public.teachers where status='active')::bigint faculty;

grant select on public.public_faculty to anon,authenticated;
grant select on public.approved_student_reviews to anon,authenticated;
grant select on public.public_stats to anon,authenticated;
revoke all on function public.get_public_stats() from anon,authenticated;

insert into public.site_settings(id,settings)
values(1,'{
"heroEyebrow":"LEARN • CREATE • EXPRESS",
"heroTitle":"Art Builds\\na Kinder,\\nBrighter World",
"heroSubtitle":"Music. Dance. Photography. Visual Art. And More.",
"heroText":"At Surchobi, we nurture creativity, discipline and self-expression through the arts. Discover your passion, learn from expert mentors, and be part of a vibrant community.",
"exploreText":"Explore Courses",
"storyTitle":"Nurturing Creativity\\nFor a Brighter Tomorrow",
"storyText":"Surchobi is a creative arts academy built on the belief that the arts make life richer, kinder and more meaningful. We provide a supportive space for learners of all ages to explore, grow and express themselves through music, movement and more.",
"storyImage":"",
"fontFamily":"Playfair Display",
"bodyFont":"DM Sans",
"primaryColor":"#062f2f",
"accentColor":"#e3c27d",
"pageBackground":"#f4f1e9",
"heroMusicImage":"/hero-music.jpg?v=20260908",
"heroDanceImage":"/hero-dance.jpg",
"heroPhotoImage":"/hero-photography.webp?v=20260909",
"heroArtImage":"https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85",
"heroYogaImage":"https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=85",
"heroOthersImage":"https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=85",
"showBenefits":true,"showStory":true,"showStats":true,"showTestimonials":true
}'::jsonb)
on conflict(id) do nothing;

do $$
declare r record;
begin
 for r in select tablename,policyname from pg_policies where schemaname='public' loop
  execute format('drop policy if exists %I on public.%I',r.policyname,r.tablename);
 end loop;
end $$;

create policy categories_select on public.categories for select to anon,authenticated using(true);
create policy categories_insert_admin on public.categories for insert to authenticated with check((select is_admin()));
create policy categories_update_admin on public.categories for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy categories_delete_admin on public.categories for delete to authenticated using((select is_admin()));

create policy courses_select on public.courses for select to anon,authenticated using(true);
create policy courses_insert_admin on public.courses for insert to authenticated with check((select is_admin()));
create policy courses_update_admin on public.courses for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy courses_delete_admin on public.courses for delete to authenticated using((select is_admin()));

create policy profiles_select_own_admin on public.profiles for select to authenticated using(id=(select auth.uid()) or (select is_admin()));

create policy students_select_role_aware on public.students for select to authenticated using(id=(select auth.uid()) or (select is_admin()) or public.is_teacher_assigned_to_student(id));
create policy students_insert_admin on public.students for insert to authenticated with check((select is_admin()));
create policy students_update_admin on public.students for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy students_delete_admin on public.students for delete to authenticated using((select is_admin()));

create policy teachers_select_role_aware on public.teachers for select to authenticated using(id=(select auth.uid()) or (select is_admin()));
create policy teachers_insert_admin on public.teachers for insert to authenticated with check((select is_admin()));
create policy teachers_update_admin on public.teachers for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy teachers_delete_admin on public.teachers for delete to authenticated using((select is_admin()));

create policy batches_select_role_aware on public.batches for select to authenticated using((select is_admin()) or teacher_id=(select auth.uid()) or public.is_student_in_batch(id));
create policy batches_insert_admin on public.batches for insert to authenticated with check((select is_admin()));
create policy batches_update_admin on public.batches for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy batches_delete_admin on public.batches for delete to authenticated using((select is_admin()));

create policy enrollments_select_role_aware on public.enrollments for select to authenticated using(student_id=(select auth.uid()) or (select is_admin()) or public.is_teacher_for_batch(batch_id));
create policy enrollments_insert_admin on public.enrollments for insert to authenticated with check((select is_admin()));
create policy enrollments_update_admin on public.enrollments for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy enrollments_delete_admin on public.enrollments for delete to authenticated using((select is_admin()));

create policy attendance_select_role_aware on public.attendance for select to authenticated using(student_id=(select auth.uid()) or (select is_admin()) or public.is_teacher_for_batch(batch_id));
create policy attendance_insert_role_aware on public.attendance for insert to authenticated with check((select is_admin()) or (marked_by=(select auth.uid()) and public.is_teacher_for_batch(batch_id)));
create policy attendance_update_role_aware on public.attendance for update to authenticated using((select is_admin()) or public.is_teacher_for_batch(batch_id)) with check((select is_admin()) or (marked_by=(select auth.uid()) and public.is_teacher_for_batch(batch_id)));
create policy attendance_delete_admin on public.attendance for delete to authenticated using((select is_admin()));

create policy fee_records_select_role_aware on public.fee_records for select to authenticated using(student_id=(select auth.uid()) or (select is_admin()) or exists(select 1 from public.enrollments e where e.student_id=fee_records.student_id and public.is_teacher_for_batch(e.batch_id)));
create policy fee_records_insert_admin on public.fee_records for insert to authenticated with check((select is_admin()));
create policy fee_records_update_role_aware on public.fee_records for update to authenticated using((select is_admin()) or exists(select 1 from public.enrollments e where e.student_id=fee_records.student_id and public.is_teacher_for_batch(e.batch_id))) with check((select is_admin()) or exists(select 1 from public.enrollments e where e.student_id=fee_records.student_id and public.is_teacher_for_batch(e.batch_id)));
create policy fee_records_delete_admin on public.fee_records for delete to authenticated using((select is_admin()));

create policy notices_select_authenticated on public.notices for select to authenticated using(true);
create policy notices_insert_admin on public.notices for insert to authenticated with check((select is_admin()));
create policy notices_update_admin on public.notices for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy notices_delete_admin on public.notices for delete to authenticated using((select is_admin()));

create policy student_reviews_select_own_admin on public.student_reviews for select to authenticated using(student_id=(select auth.uid()) or (select is_admin()));
create policy student_reviews_insert_student on public.student_reviews for insert to authenticated with check(student_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='student' and p.status='active'));
create policy student_reviews_update_role_aware on public.student_reviews for update to authenticated using(student_id=(select auth.uid()) or (select is_admin())) with check(student_id=(select auth.uid()) or (select is_admin()));
create policy student_reviews_delete_role_aware on public.student_reviews for delete to authenticated using(student_id=(select auth.uid()) or (select is_admin()));

create policy gallery_items_select_approved on public.gallery_items for select to anon,authenticated using(approved=true);
create policy gallery_items_insert_admin on public.gallery_items for insert to authenticated with check((select is_admin()));
create policy gallery_items_update_admin on public.gallery_items for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy gallery_items_delete_admin on public.gallery_items for delete to authenticated using((select is_admin()));

create policy teacher_course_requests_select_role_aware on public.teacher_course_requests for select to authenticated using(teacher_id=(select auth.uid()) or (select is_admin()));
create policy teacher_course_requests_insert_self on public.teacher_course_requests for insert to authenticated with check(teacher_id=(select auth.uid()));
create policy teacher_course_requests_update_self on public.teacher_course_requests for update to authenticated using(teacher_id=(select auth.uid())) with check(teacher_id=(select auth.uid()));
create policy teacher_course_requests_delete_role_aware on public.teacher_course_requests for delete to authenticated using(teacher_id=(select auth.uid()) or (select is_admin()));

create policy teacher_courses_select_role_aware on public.teacher_courses for select to authenticated using(teacher_id=(select auth.uid()) or (select is_admin()));
create policy teacher_courses_insert_admin on public.teacher_courses for insert to authenticated with check((select is_admin()));
create policy teacher_courses_update_admin on public.teacher_courses for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy teacher_courses_delete_admin on public.teacher_courses for delete to authenticated using((select is_admin()));

create policy site_settings_select on public.site_settings for select to anon,authenticated using(true);
create policy site_settings_insert_admin on public.site_settings for insert to authenticated with check((select is_admin()));
create policy site_settings_update_admin on public.site_settings for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy site_settings_delete_admin on public.site_settings for delete to authenticated using((select is_admin()));

create index if not exists idx_profiles_requested_course_id on public.profiles(requested_course_id);
create index if not exists idx_teacher_course_requests_course_id on public.teacher_course_requests(course_id);
create index if not exists idx_teacher_courses_course_id on public.teacher_courses(course_id);
create index if not exists idx_teachers_subject_course_id on public.teachers(subject_course_id);

update storage.buckets set file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='faculty';
