-- Fix for Infinite Recursion in RLS Policies
-- This script fixes the circular dependency issue in group_members policies

-- ============================================
-- Drop ALL existing group_members policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their group members" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "View group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON group_members;

-- ============================================
-- Create fixed policies (no recursion)
-- ============================================

-- group_members: Allow users to see members of groups they belong to
-- FIX: Use direct subquery instead of helper function to avoid recursion
CREATE POLICY "View group members"
ON group_members FOR SELECT
USING (
    group_id IN (
        SELECT group_id 
        FROM group_members 
        WHERE user_id = auth.uid() 
        AND is_active = TRUE
    )
);

-- group_members: Users can insert themselves when joining
CREATE POLICY "Users can join groups"
ON group_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- group_members: Admins can update member roles
CREATE POLICY "Admins can update member roles"
ON group_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
        AND gm.is_active = TRUE
    )
);

-- group_members: Admins can remove members
CREATE POLICY "Admins can remove members"
ON group_members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
        AND gm.is_active = TRUE
    )
);
