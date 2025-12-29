-- Add latitude and longitude columns to trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
