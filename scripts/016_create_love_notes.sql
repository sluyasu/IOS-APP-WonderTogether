create table if not exists love_notes (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  content text not null,
  theme text default 'love_red',
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table love_notes enable row level security;

-- Policies
create policy "Users can view love notes in their group"
  on love_notes for select
  using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Users can insert love notes in their group"
  on love_notes for insert
  with check (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Users can update love notes in their group"
  on love_notes for update
  using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );
