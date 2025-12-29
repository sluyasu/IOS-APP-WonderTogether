-- Create messages table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  content text,
  type text default 'text', -- 'text', 'capsule', 'system', 'image'
  metadata jsonb default '{}'::jsonb, -- Stores unlock_date, location, vibe, etc.
  is_locked boolean default false,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table messages enable row level security;

-- Policies
create policy "Users can view messages in their group"
  on messages for select
  using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their group"
  on messages for insert
  with check (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Users can update messages in their group"
  on messages for update
  using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );
