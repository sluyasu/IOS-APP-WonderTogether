-- Multi-Group Support: Add group types and tracking
-- Run this in Supabase SQL Editor

-- ============================================
-- Add Group Type and Description
-- ============================================

-- Add group_type column with predefined types
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'couples' 
CHECK (group_type IN ('couples', 'family', 'friends', 'travel_buddies', 'other'));

-- Add description for custom groups
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================
-- Track Active Group per User
-- ============================================

-- Add last_accessed to track which group was viewed last
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP DEFAULT NOW();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_last_accessed 
ON group_members(user_id, last_accessed DESC);

-- ============================================
-- Helper Function: Update last accessed
-- ============================================

CREATE OR REPLACE FUNCTION update_group_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    -- When a group is accessed, update the timestamp
    UPDATE group_members
    SET last_accessed = NOW()
    WHERE user_id = auth.uid() 
    AND group_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We'll manually call this from the app when switching groups
-- to avoid trigger overhead on every select
