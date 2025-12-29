-- Add new columns for enhanced calendar features
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#e07a5f';

-- Comment on columns
COMMENT ON COLUMN events.is_all_day IS 'Flag for all-day events (ignores time)';
COMMENT ON COLUMN events.color IS 'Hex color code for the event category';
