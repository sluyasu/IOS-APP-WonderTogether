-- ============================================
-- WonderTogether: Group Authentication System
-- Database Migration Script
-- ============================================

-- Part 1: Create New Tables
-- ============================================

-- Groups table: Stores travel groups (couples/families)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anniversary_date DATE,
    group_avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);
COMMENT ON TABLE groups IS 'Travel groups that share trips and memories';
COMMENT ON COLUMN groups.join_code IS '8-character unique code for joining the group';

-- Group members table: Maps users to groups
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_active ON group_members(group_id, is_active);
COMMENT ON TABLE group_members IS 'Maps users to their travel groups';

-- Profiles table: User profile information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profile information and avatars';

-- Part 2: Add group_id to Existing Tables
-- ============================================

-- Add group_id to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_trips_group ON trips(group_id);

-- Add group_id to memories
ALTER TABLE memories ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_memories_group ON memories(group_id);

-- Add group_id to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_events_group ON events(group_id);

-- Add group_id to bucket_list
ALTER TABLE bucket_list ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bucket_list_group ON bucket_list(group_id);

-- Add group_id to wishlists
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_wishlists_group ON wishlists(group_id);

-- Part 3: Database Functions
-- ============================================

-- Function: Generate unique join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars
    result TEXT := '';
    i INTEGER;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM groups WHERE join_code = result) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'display_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Part 4: Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Groups policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
CREATE POLICY "Users can view their groups"
    ON groups FOR SELECT
    USING (
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups"
    ON groups FOR INSERT
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update groups" ON groups;
CREATE POLICY "Admins can update groups"
    ON groups FOR UPDATE
    USING (
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = TRUE
        )
    );

-- Group members policies
DROP POLICY IF EXISTS "View group members" ON group_members;
CREATE POLICY "View group members"
    ON group_members FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Profiles policies
DROP POLICY IF EXISTS "View group member profiles" ON profiles;
CREATE POLICY "View group member profiles"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT gm.user_id FROM group_members gm
            WHERE gm.group_id IN (
                SELECT group_id FROM group_members 
                WHERE user_id = auth.uid() AND is_active = TRUE
            )
        )
        OR id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Update own profile" ON profiles;
CREATE POLICY "Update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Trips policies
DROP POLICY IF EXISTS "Group members can view trips" ON trips;
CREATE POLICY "Group members can view trips"
    ON trips FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can create trips" ON trips;
CREATE POLICY "Group members can create trips"
    ON trips FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can update trips" ON trips;
CREATE POLICY "Group members can update trips"
    ON trips FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can delete trips" ON trips;
CREATE POLICY "Group members can delete trips"
    ON trips FOR DELETE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Memories policies
DROP POLICY IF EXISTS "Group members can view memories" ON memories;
CREATE POLICY "Group members can view memories"
    ON memories FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can create memories" ON memories;
CREATE POLICY "Group members can create memories"
    ON memories FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can update memories" ON memories;
CREATE POLICY "Group members can update memories"
    ON memories FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can delete memories" ON memories;
CREATE POLICY "Group members can delete memories"
    ON memories FOR DELETE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Events policies
DROP POLICY IF EXISTS "Group members can view events" ON events;
CREATE POLICY "Group members can view events"
    ON events FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can create events" ON events;
CREATE POLICY "Group members can create events"
    ON events FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can update events" ON events;
CREATE POLICY "Group members can update events"
    ON events FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can delete events" ON events;
CREATE POLICY "Group members can delete events"
    ON events FOR DELETE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Bucket list policies
DROP POLICY IF EXISTS "Group members can view bucket_list" ON bucket_list;
CREATE POLICY "Group members can view bucket_list"
    ON bucket_list FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can create bucket_list" ON bucket_list;
CREATE POLICY "Group members can create bucket_list"
    ON bucket_list FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can update bucket_list" ON bucket_list;
CREATE POLICY "Group members can update bucket_list"
    ON bucket_list FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can delete bucket_list" ON bucket_list;
CREATE POLICY "Group members can delete bucket_list"
    ON bucket_list FOR DELETE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Wishlists policies
DROP POLICY IF EXISTS "Group members can view wishlists" ON wishlists;
CREATE POLICY "Group members can view wishlists"
    ON wishlists FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can create wishlists" ON wishlists;
CREATE POLICY "Group members can create wishlists"
    ON wishlists FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can update wishlists" ON wishlists;
CREATE POLICY "Group members can update wishlists"
    ON wishlists FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Group members can delete wishlists" ON wishlists;
CREATE POLICY "Group members can delete wishlists"
    ON wishlists FOR DELETE
    USING (
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Part 5: Storage Bucket Policies
-- ============================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('group-avatars', 'group-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Group avatar storage policies
DROP POLICY IF EXISTS "Group members can upload group avatar" ON storage.objects;
CREATE POLICY "Group members can upload group avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'group-avatars' AND 
        (storage.foldername(name))[1]::uuid IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Anyone can view group avatars" ON storage.objects;
CREATE POLICY "Anyone can view group avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'group-avatars');

-- Part 6: Helper Functions
-- ============================================

-- Function: Get user's current group
CREATE OR REPLACE FUNCTION get_user_group(user_uuid UUID)
RETURNS TABLE (
    group_id UUID,
    group_name TEXT,
    join_code TEXT,
    anniversary_date DATE,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.join_code,
        g.anniversary_date,
        gm.role
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = user_uuid AND gm.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get group members with profiles
CREATE OR REPLACE FUNCTION get_group_members(group_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.display_name,
        p.full_name,
        p.avatar_url,
        gm.role,
        gm.joined_at
    FROM profiles p
    INNER JOIN group_members gm ON p.id = gm.user_id
    WHERE gm.group_id = group_uuid AND gm.is_active = TRUE
    ORDER BY gm.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration Complete
-- ============================================

COMMENT ON SCHEMA public IS 'WonderTogether Group Authentication System v1.0';
