/**
 * Fix Duplicate Super Admin Role Definitions
 * 
 * IMPORTANT: 
 * - Hanya boleh ada 1 role definition dengan role_key 'super_admin' di table roles
 * - Tapi bisa ada BANYAK users yang punya role super_admin (di user_role_assignments)
 * 
 * Migration ini:
 * 1. Menjaga hanya 1 role definition 'super_admin' yang aktif
 * 2. Memigrasikan semua user_role_assignments dari duplicate roles ke role yang dipertahankan
 * 3. Menambahkan constraint untuk mencegah duplicate role definitions di masa depan
 * 
 * Setelah migration, Anda bisa assign role super_admin ke banyak users melalui user_role_assignments.
 */

-- Step 1: Find duplicate super_admin roles
-- Note: Table roles doesn't have is_active column, so we just keep the first one
DO $$
DECLARE
  v_keep_role_id UUID;
  v_duplicate_role_ids UUID[];
BEGIN
  -- Get the first super_admin role (keep this one - oldest by created_at)
  SELECT id INTO v_keep_role_id
  FROM roles
  WHERE role_key = 'super_admin'
  ORDER BY created_at ASC
  LIMIT 1;

  -- If no role found, exit
  IF v_keep_role_id IS NULL THEN
    RAISE NOTICE 'No super_admin role found';
    RETURN;
  END IF;

  -- Get all duplicate super_admin role IDs (excluding the one we're keeping)
  SELECT ARRAY_AGG(id) INTO v_duplicate_role_ids
  FROM roles
  WHERE role_key = 'super_admin'
    AND id != v_keep_role_id;

  -- If we have duplicates, migrate role assignments and delete duplicates
  IF v_duplicate_role_ids IS NOT NULL AND array_length(v_duplicate_role_ids, 1) > 0 THEN
    RAISE NOTICE 'Found % duplicate super_admin roles. Keeping role ID: %', 
      array_length(v_duplicate_role_ids, 1), v_keep_role_id;

    -- Migrate role assignments from duplicate roles to the kept role
    UPDATE user_role_assignments
    SET role_id = v_keep_role_id,
        updated_at = NOW()
    WHERE role_id = ANY(v_duplicate_role_ids)
      AND NOT EXISTS (
        SELECT 1 FROM user_role_assignments ura2
        WHERE ura2.user_id = user_role_assignments.user_id
          AND ura2.role_id = v_keep_role_id
          AND ura2.is_active = true
      );

    -- Delete duplicate roles (since roles table doesn't have is_active, we delete them)
    -- But first check if they're referenced anywhere else
    DELETE FROM roles
    WHERE id = ANY(v_duplicate_role_ids)
      AND NOT EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.role_id = roles.id
      );

    RAISE NOTICE 'Migrated role assignments and deleted duplicate roles';
  ELSE
    RAISE NOTICE 'No duplicate super_admin roles found';
  END IF;
END $$;

-- Step 2: Add unique constraint to prevent future duplicate role definitions
-- Note: Constraint ini hanya mencegah duplicate role definitions, BUKAN membatasi jumlah users dengan role super_admin
-- Banyak users bisa punya role super_admin melalui user_role_assignments table
DO $$
BEGIN
  -- Check if unique constraint on role_key already exists (from migration 004)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'roles_role_key_key'
  ) THEN
    -- Add unique constraint on role_key (should already exist from migration 004, but adding as safety)
    ALTER TABLE roles ADD CONSTRAINT roles_role_key_key UNIQUE (role_key);
    RAISE NOTICE 'Added unique constraint on role_key';
  ELSE
    RAISE NOTICE 'Unique constraint on role_key already exists';
  END IF;
END $$;

-- Step 3: Verify fix
-- Should show only 1 super_admin role
SELECT 
  role_key,
  COUNT(*) as count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM roles
WHERE role_key = 'super_admin'
GROUP BY role_key;

