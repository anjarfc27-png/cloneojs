# Migration 004 - Fix Notes

## Problem
Error: `relation "activity_logs" does not exist`

## Root Cause
The migration was trying to ALTER TABLE `activity_logs` before ensuring the table exists.

## Solution
1. **Created `activity_logs` table first** (if not exists) before trying to ALTER it
2. **Added safe column addition** using `ADD COLUMN IF NOT EXISTS`
3. **Added safe RLS policy creation** using `DROP POLICY IF EXISTS` before creating
4. **Added extension check** to ensure `uuid-ossp` is enabled

## Changes Made

### 1. Added Extension Check
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Create activity_logs Table Before ALTER
```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Safe Column Addition
```sql
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### 4. Safe RLS Policy Creation
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    DROP POLICY IF EXISTS "super_admin_read_activity_logs" ON activity_logs;
    DROP POLICY IF EXISTS "super_admin_write_activity_logs" ON activity_logs;
    
    CREATE POLICY "super_admin_read_activity_logs" ON activity_logs
      FOR SELECT
      TO authenticated
      USING (user_is_super_admin(auth.uid()));
    
    CREATE POLICY "super_admin_write_activity_logs" ON activity_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (user_is_super_admin(auth.uid()));
  END IF;
END $$;
```

## Migration Order
1. Enable extensions
2. Create tables (sites, roles, permissions, etc.)
3. Create activity_logs table (if not exists)
4. Alter tables to add columns
5. Create indexes
6. Create helper functions
7. Enable RLS
8. Create RLS policies (using functions created in step 6)
9. Create triggers
10. Add comments

## Testing
After running the migration, verify:
1. `activity_logs` table exists
2. `actor_id` column exists in `activity_logs`
3. RLS policies are created for `activity_logs`
4. No errors in migration log

## Notes
- This migration is idempotent (can be run multiple times safely)
- Uses `IF NOT EXISTS` and `IF EXISTS` checks throughout
- Preserves existing data
- Backward compatible with existing schema



