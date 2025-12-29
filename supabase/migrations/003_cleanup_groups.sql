-- Clean up script - Delete all existing data to start fresh
-- Run this in Supabase SQL Editor

-- Delete all group members
DELETE FROM group_members;

-- Delete all groups  
DELETE FROM groups;

-- Delete all profiles (optional - if you want to start completely fresh)
-- DELETE FROM profiles;

-- Note: This will NOT delete your auth users
-- Users will go through onboarding when they log in next
