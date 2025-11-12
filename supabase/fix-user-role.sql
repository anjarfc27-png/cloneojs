/**
 * Fix Super Admin Role for Specific User
 * 
 * Run this in Supabase SQL Editor
 * This will assign super_admin role to anjarbdn@gmail.com
 */

DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
  v_user_email TEXT := 'anjarbdn@gmail.com';
BEGIN
  -- Step 1: Get user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = v_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', v_user_email;
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', v_user_email, v_user_id;

  -- Step 2: Get super_admin role ID
  SELECT id INTO v_role_id 
  FROM roles 
  WHERE role_key = 'super_admin' 
  LIMIT 1;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found. Please run migration 004 first.';
  END IF;

  RAISE NOTICE 'Found super_admin role (ID: %)', v_role_id;

  -- Step 3: Assign role in user_role_assignments (new structure)
  INSERT INTO user_role_assignments (user_id, role_id, journal_id, tenant_id, is_active, created_at, updated_at)
  VALUES (v_user_id, v_role_id, NULL, NULL, true, NOW(), NOW())
  ON CONFLICT (user_id, role_id, journal_id, tenant_id) 
  DO UPDATE SET 
    is_active = true, 
    updated_at = NOW();

  RAISE NOTICE '✅ Assigned role in user_role_assignments';

  -- Step 4: Assign role in tenant_users (old structure - backward compatibility)
  INSERT INTO tenant_users (user_id, tenant_id, role, is_active, created_at, updated_at)
  VALUES (v_user_id, NULL, 'super_admin', true, NOW(), NOW())
  ON CONFLICT (user_id, tenant_id, role) 
  DO UPDATE SET 
    is_active = true, 
    updated_at = NOW();

  RAISE NOTICE '✅ Assigned role in tenant_users';

  -- Step 5: Verify
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION ===';
  
  -- Check user_role_assignments
  PERFORM 1 FROM user_role_assignments 
  WHERE user_id = v_user_id 
    AND role_id = v_role_id 
    AND is_active = true;
  
  IF FOUND THEN
    RAISE NOTICE '✅ user_role_assignments: OK';
  ELSE
    RAISE WARNING '❌ user_role_assignments: NOT FOUND';
  END IF;

  -- Check tenant_users
  PERFORM 1 FROM tenant_users 
  WHERE user_id = v_user_id 
    AND role = 'super_admin' 
    AND is_active = true;
  
  IF FOUND THEN
    RAISE NOTICE '✅ tenant_users: OK';
  ELSE
    RAISE WARNING '❌ tenant_users: NOT FOUND';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ DONE! User % is now super admin', v_user_email;
  RAISE NOTICE 'Please logout and login again to refresh session.';
END $$;

-- Verify after fix
SELECT 
  u.email,
  r.role_key,
  r.name,
  ura.is_active as ura_active,
  tu.is_active as tu_active,
  ura.created_at as assigned_at
FROM auth.users u
LEFT JOIN user_role_assignments ura ON ura.user_id = u.id
LEFT JOIN roles r ON r.id = ura.role_id AND r.role_key = 'super_admin'
LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.role = 'super_admin'
WHERE u.email = 'anjarbdn@gmail.com';

