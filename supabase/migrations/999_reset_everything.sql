-- ============================================
-- COMPLETE DATABASE RESET
-- WARNING: This will delete ALL data!
-- ============================================

-- Delete all storage bucket files
DELETE FROM storage.objects WHERE bucket_id = 'covers';
DELETE FROM storage.objects WHERE bucket_id = 'group-avatars';
DELETE FROM storage.objects WHERE bucket_id = 'memories';
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- Delete all app data (cascades will handle related records)
DELETE FROM bucket_list;
DELETE FROM wishlists;
DELETE FROM events;
DELETE FROM memories;
DELETE FROM trips;
DELETE FROM group_members;
DELETE FROM groups;
DELETE FROM profiles;

-- Delete all users (this will cascade delete their auth data)
DELETE FROM auth.users;

-- Reset any sequences if needed
-- (Optional, only if you want IDs to start from 1 again)

-- Verify everything is clean
SELECT 'Remaining users:' as check_type, count(*) as count FROM auth.users
UNION ALL
SELECT 'Remaining groups:', count(*) FROM groups
UNION ALL
SELECT 'Remaining trips:', count(*) FROM trips
UNION ALL
SELECT 'Remaining memories:', count(*) FROM memories
UNION ALL
SELECT 'Remaining storage files:', count(*) FROM storage.objects;
