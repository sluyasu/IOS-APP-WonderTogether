-- Migration to support Multi-Group System by relaxing legacy "couple" constraints
-- Run this in your Supabase SQL Editor to fix "null value in column couple_id" errors

-- 1. Trips
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'couple_id') THEN
        ALTER TABLE trips ALTER COLUMN couple_id DROP NOT NULL;
    END IF;
END $$;

-- 2. Memories
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memories' AND column_name = 'couple_id') THEN
        ALTER TABLE memories ALTER COLUMN couple_id DROP NOT NULL;
    END IF;
END $$;

-- 3. Events
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'couple_id') THEN
        ALTER TABLE events ALTER COLUMN couple_id DROP NOT NULL;
    END IF;
END $$;

-- 4. Bucket List
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bucket_list' AND column_name = 'couple_id') THEN
        ALTER TABLE bucket_list ALTER COLUMN couple_id DROP NOT NULL;
    END IF;
END $$;

-- 5. Wishlists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'couple_id') THEN
        ALTER TABLE wishlists ALTER COLUMN couple_id DROP NOT NULL;
    END IF;
END $$;
