-- Reset RLS for profiles to ensure clean slate
alter table profiles enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can view their own profile" on profiles;

-- Create permissive policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Ensure authenticated users have permissions on the table
grant all on profiles to authenticated;
grant all on profiles to service_role;
