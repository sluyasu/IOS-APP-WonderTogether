# Running the Database Migration

## Prerequisites
- Access to your Supabase dashboard
- Database connection details

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_group_auth_system.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration
7. Verify success - you should see "Success. No rows returned"

### Option 2: Using Supabase CLI
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push

# Or run specific file
supabase db execute  --file-path supabase/migrations/001_group_auth_system.sql
```

## Verification Steps

After running the migration, verify the setup:

### 1. Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'group_members', 'profiles');
-- Should return 3 rows
```

### 2. Check Indexes
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('groups', 'group_members');
-- Should return multiple indexes
```

### 3. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
-- Should return many policies
```

### 4. Test Join Code Generation
```sql
SELECT generate_join_code();
-- Should return an 8-character code like "A3B7K9M2"
```

### 5. Check Storage Buckets
```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('avatars', 'group-avatars');
-- Should return 2 rows
```

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Remove group_id columns from existing tables
ALTER TABLE trips DROP COLUMN IF EXISTS group_id;
ALTER TABLE memories DROP COLUMN IF EXISTS group_id;
ALTER TABLE events DROP COLUMN IF EXISTS group_id;
ALTER TABLE bucket_list DROP COLUMN IF EXISTS group_id;
ALTER TABLE wishlist DROP COLUMN IF EXISTS group_id;

-- Drop functions
DROP FUNCTION IF EXISTS generate_join_code();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_user_group(UUID);
DROP FUNCTION IF EXISTS get_group_members(UUID);

-- Drop storage buckets (warning: deletes all data!)
DELETE FROM storage.buckets WHERE id IN ('avatars', 'group-avatars');
```

## Troubleshooting

### Error: "relation already exists"
- The migration has partial been run before
- Either run the individual missing statements or perform a rollback first

### Error: "must be owner of table"
- You need admin/owner permissions on the database
- Contact your Supabase project owner

### Error: "uuid_generate_v4 does not exist"
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- This should be enabled by default in Supabase

## Next Steps

After successfully applying the migration:
1. ✅ Database schema is ready
2. ➡️ Move to Phase 2: Create onboarding screens
3. ➡️ Implement TypeScript group utilities
