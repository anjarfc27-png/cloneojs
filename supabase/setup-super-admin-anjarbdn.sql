-- ============================================
-- SETUP SUPER ADMIN untuk anjarbdn@gmail.com
-- User ID: 655ca435-ea20-4dea-817e-4ae1bdf8e86c
-- ============================================
-- Jalankan script ini di Supabase SQL Editor

-- Step 1: Buat default tenant jika belum ada
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Setup super admin untuk user_id: 655ca435-ea20-4dea-817e-4ae1bdf8e86c
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
SELECT 
  '655ca435-ea20-4dea-817e-4ae1bdf8e86c'::UUID,
  t.id,
  'super_admin',
  true
FROM tenants t
WHERE t.slug = 'default-journal'
ON CONFLICT (user_id, tenant_id)
DO UPDATE SET 
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- Step 3: Buat journal default untuk tenant jika belum ada
INSERT INTO journals (tenant_id, title, description, abbreviation, language, is_active)
SELECT 
  t.id,
  'Default Journal',
  'Default journal for super admin management',
  'DJ',
  'id',
  true
FROM tenants t
WHERE t.slug = 'default-journal'
AND NOT EXISTS (
  SELECT 1 FROM journals j WHERE j.tenant_id = t.id
);

-- Step 4: Verifikasi hasil
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
WHERE tu.user_id = '655ca435-ea20-4dea-817e-4ae1bdf8e86c'::UUID
ORDER BY tu.created_at DESC;

-- Step 5: Check semua super admin
SELECT 
  tu.user_id,
  tu.role,
  tu.is_active,
  t.name as tenant_name,
  tu.created_at
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role = 'super_admin'
AND tu.is_active = true
ORDER BY tu.created_at DESC;



