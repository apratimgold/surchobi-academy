-- Store a contact number for every registered Surchobi user.
alter table public.profiles
  add column if not exists phone text;

-- Phone is collected by the registration form. Existing accounts remain unaffected.
comment on column public.profiles.phone is 'Primary contact phone number supplied during registration';