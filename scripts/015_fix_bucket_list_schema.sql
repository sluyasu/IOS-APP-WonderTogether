-- Fix missing columns in bucket_list_items
alter table bucket_list_items add column if not exists country text;
alter table bucket_list_items add column if not exists note text;
alter table bucket_list_items add column if not exists icon text;

-- Force schema cache reload (usually happens auto, but commenting just in case)
-- NOTIFY pgrst, 'reload config';
