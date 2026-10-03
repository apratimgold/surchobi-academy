-- Surchobi policy hardening applied to production on 2026-10-03.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_teacher_for_batch(p_batch_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.batches where id=p_batch_id and teacher_id=auth.uid()) $$;

create or replace function private.is_student_in_batch(p_batch_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.enrollments where batch_id=p_batch_id and student_id=auth.uid()) $$;

create or replace function private.is_teacher_assigned_to_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.enrollments e join public.batches b on b.id=e.batch_id where e.student_id=p_student_id and b.teacher_id=auth.uid()) $$;

revoke all on function private.is_teacher_for_batch(uuid) from public,anon,authenticated;
revoke all on function private.is_student_in_batch(uuid) from public,anon,authenticated;
revoke all on function private.is_teacher_assigned_to_student(uuid) from public,anon,authenticated;
grant execute on function private.is_teacher_for_batch(uuid) to authenticated;
grant execute on function private.is_student_in_batch(uuid) to authenticated;
grant execute on function private.is_teacher_assigned_to_student(uuid) to authenticated;

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
create policy profiles_update_own on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));

create policy students_select_role_aware on public.students for select to authenticated using(id=(select auth.uid()) or (select is_admin()) or private.is_teacher_assigned_to_student(id));
create policy students_insert_admin on public.students for insert to authenticated with check((select is_admin()));
create policy students_update_admin on public.students for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy students_delete_admin on public.students for delete to authenticated using((select is_admin()));

create policy teachers_select_role_aware on public.teachers for select to authenticated using(id=(select auth.uid()) or (select is_admin()));
create policy teachers_insert_admin on public.teachers for insert to authenticated with check((select is_admin()));
create policy teachers_update_admin on public.teachers for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy teachers_delete_admin on public.teachers for delete to authenticated using((select is_admin()));

create policy batches_select_role_aware on public.batches for select to authenticated using((select is_admin()) or teacher_id=(select auth.uid()) or private.is_student_in_batch(id));
create policy batches_insert_admin on public.batches for insert to authenticated with check((select is_admin()));
create policy batches_update_admin on public.batches for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy batches_delete_admin on public.batches for delete to authenticated using((select is_admin()));

create policy enrollments_select_role_aware on public.enrollments for select to authenticated using(student_id=(select auth.uid()) or (select is_admin()) or private.is_teacher_for_batch(batch_id));
create policy enrollments_insert_admin on public.enrollments for insert to authenticated with check((select is_admin()));
create policy enrollments_update_admin on public.enrollments for update to authenticated using((select is_admin())) with check((select is_admin()));
create policy enrollments_delete_admin on public.enrollments for delete to authenticated using((select is_admin()));

create policy attendance_select_role_aware on public.attendance for select to authenticated using(student_id=(select auth.uid()) or (select is_admin()) or private.is_teacher_for_batch(batch_id));
create policy attendance_insert_role_aware on public.attendance for insert to authenticated with check((select is_admin()) or (marked_by=(select auth.uid()) and private.is_teacher_for_batch(batch_id)));
create policy attendance_update_role_aware on public.attendance for update to authenticated using((select is_admin()) or private.is_teacher_for_batch(batch_id)) with check((select is_admin()) or (marked_by=(select auth.uid()) and private.is_teacher_for_batch(batch_id)));
create policy attendance_delete_admin on public.attendance for delete to authenticated using((select is_admin()));

create policy fee_records_select_role_aware on public.fee_records for select to authenticated using(student_id=(select auth.uid()) or (select is_admin()) or exists(select 1 from public.enrollments e where e.student_id=fee_records.student_id and private.is_teacher_for_batch(e.batch_id)));
create policy fee_records_insert_admin on public.fee_records for insert to authenticated with check((select is_admin()));
create policy fee_records_update_role_aware on public.fee_records for update to authenticated using((select is_admin()) or exists(select 1 from public.enrollments e where e.student_id=fee_records.student_id and private.is_teacher_for_batch(e.batch_id))) with check((select is_admin()) or exists(select 1 from public.enrollments e where e.student_id=fee_records.student_id and private.is_teacher_for_batch(e.batch_id)));
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

revoke update on public.profiles from authenticated;
grant update(full_name,phone,avatar_url) on public.profiles to authenticated;

drop function if exists public.is_teacher_for_batch(uuid);
drop function if exists public.is_student_in_batch(uuid);
drop function if exists public.is_teacher_assigned_to_student(uuid);
drop function if exists public.get_public_stats();

create or replace function public.update_my_profile(p_full_name text,p_phone text,p_avatar_url text default null)
returns boolean language plpgsql security invoker set search_path=public
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
