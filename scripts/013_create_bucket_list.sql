-- Create bucket_list_items table with enhanced fields for Dream Destinations
create table if not exists bucket_list_items (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  title text not null, -- The location name, e.g. "Tokyo"
  country text,        -- The country, e.g. "Japan"
  note text,           -- Motivation/Description, e.g. "For the culture"
  icon text,           -- Emoji icon, e.g. "🌍"
  is_completed boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table bucket_list_items enable row level security;

-- Policies (assuming group_members maps user_id to group_id)
create policy "Users can view bucket list items of their group"
  on bucket_list_items for select
  using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Users can insert bucket list items into their group"
  on bucket_list_items for insert
  with check (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Users can update bucket list items of their group"
  on bucket_list_items for update
  using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Users can delete bucket list items of their group"
  on bucket_list_items for delete
  using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );
