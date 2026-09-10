-- Public faculty photographs managed by admins.
insert into storage.buckets (id, name, public)
values ('faculty', 'faculty', true)
on conflict (id) do update set public = true;

create policy "Faculty photos are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'faculty');

create policy "Admins can upload faculty photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'faculty'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins can update faculty photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'faculty'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins can delete faculty photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'faculty'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);