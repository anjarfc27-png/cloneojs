-- ============================================
-- SIMPLE SUPER ADMIN SETUP
-- ============================================
-- Jalankan script ini di Supabase SQL Editor
-- Untuk setup super admin untuk user anjarbdn@gmail.com

-- ============================================
-- STEP 1: Buat default tenant jika belum ada
-- ============================================
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEP 2: Cari user_id dari auth.users
-- ============================================
-- Karena kita tidak bisa query auth.users langsung dari SQL Editor biasa,
-- kita perlu menggunakan cara berikut:

-- CARA TERMUDAH: Gunakan halaman setup di aplikasi
-- 1. Login dengan akun anjarbdn@gmail.com
-- 2. Akses: http://localhost:3000/debug/setup-super-admin
-- 3. Klik tombol "Setup Super Admin Role"
-- 4. Selesai!

-- CARA MANUAL: Jika ingin menggunakan SQL
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Cari user dengan email: anjarbdn@gmail.com
-- 3. Copy User UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
-- 4. Ganti 'YOUR_USER_ID_HERE' di bawah dengan UUID tersebut
-- 5. Jalankan script di bawah ini

-- ============================================
-- STEP 3: Setup Super Admin (GANTI USER_ID_HERE)
-- ============================================
-- GANTI 'YOUR_USER_ID_HERE' dengan UUID dari Step 2
DO $$
DECLARE
  target_user_id UUID := 'YOUR_USER_ID_HERE'::UUID;  -- GANTI INI!
  default_tenant_id UUID;
  existing_tenant_user_id UUID;
BEGIN
  -- Get default tenant ID
  SELECT id INTO default_tenant_id
  FROM tenants
  WHERE slug = 'default-journal'
  LIMIT 1;

  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found. Please run Step 1 first.';
  END IF;

  -- Check if user already has entry in tenant_users
  SELECT id INTO existing_tenant_user_id
  FROM tenant_users
  WHERE user_id = target_user_id
  AND tenant_id = default_tenant_id
  LIMIT 1;

  IF existing_tenant_user_id IS NOT NULL THEN
    -- Update existing entry
    UPDATE tenant_users
    SET 
      role = 'super_admin',
      is_active = true,
      updated_at = NOW()
    WHERE id = existing_tenant_user_id;
    
    RAISE NOTICE 'Super admin role updated for user: %', target_user_id;
  ELSE
    -- Insert new entry
    INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
    VALUES (target_user_id, default_tenant_id, 'super_admin', true);
    
    RAISE NOTICE 'Super admin role created for user: %', target_user_id;
  END IF;
END $$;

-- ============================================
-- STEP 4: Verifikasi
-- ============================================
-- Check apakah super admin sudah dibuat
SELECT 
  tu.user_id,
  tu.role,
  tu.is_active,
  t.name as tenant_name,
  t.slug as tenant_slug,
  tu.created_at,
  tu.updated_at
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role = 'super_admin'
AND tu.is_active = true
ORDER BY tu.created_at DESC;

-- ============================================
-- STEP 5: Check semua tenant_users (optional)
-- ============================================
SELECT 
  tu.user_id,
  tu.role,
  tu.is_active,
  t.name as tenant_name,
  tu.created_at
FROM tenant_users tu
LEFT JOIN tenants t ON tu.tenant_id = t.id
ORDER BY tu.created_at DESC;

