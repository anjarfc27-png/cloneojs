-- SQL Script untuk Setup Super Admin di Supabase
-- Script ini akan membuat super admin untuk email anjarbdn@gmail.com

-- 1. Buat tenant default jika belum ada
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Dapatkan ID tenant default
WITH default_tenant AS (
  SELECT id FROM tenants WHERE slug = 'default-journal' LIMIT 1
)

-- 3. Buat journal default untuk tenant tersebut
INSERT INTO journals (tenant_id, title, description, abbreviation, language, is_active)
SELECT 
  dt.id,
  'Default Journal',
  'Default journal for super admin management',
  'DJ',
  'id',
  true
FROM default_tenant dt
WHERE NOT EXISTS (
  SELECT 1 FROM journals WHERE tenant_id = dt.id
);

-- 4. Buat function untuk setup super admin
CREATE OR REPLACE FUNCTION setup_super_admin(target_email TEXT)
RETURNS TABLE (
  user_id UUID,
  tenant_id UUID,
  role TEXT,
  status TEXT
) AS $$
DECLARE
  target_user_id UUID;
  default_tenant_id UUID;
  existing_role TEXT;
BEGIN
  -- Cari user_id berdasarkan email
  SELECT au.id INTO target_user_id 
  FROM auth.users au 
  WHERE au.email = target_email
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, 'not_found', 'User tidak ditemukan';
    RETURN;
  END IF;
  
  -- Dapatkan default tenant ID
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE slug = 'default-journal' 
  LIMIT 1;
  
  -- Cek apakah user sudah memiliki role di tenant ini
  SELECT role INTO existing_role
  FROM tenant_users 
  WHERE user_id = target_user_id 
  AND tenant_id = default_tenant_id;
  
  IF existing_role IS NOT NULL THEN
    -- Update role menjadi super_admin jika sudah ada
    UPDATE tenant_users 
    SET role = 'super_admin', updated_at = NOW()
    WHERE user_id = target_user_id 
    AND tenant_id = default_tenant_id;
    
    RETURN QUERY SELECT target_user_id, default_tenant_id, 'super_admin', 'Role diupdate menjadi super_admin';
  ELSE
    -- Insert baru jika belum ada
    INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
    VALUES (target_user_id, default_tenant_id, 'super_admin', true);
    
    RETURN QUERY SELECT target_user_id, default_tenant_id, 'super_admin', 'Super admin berhasil dibuat';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Jalankan function untuk setup super admin
SELECT * FROM setup_super_admin('anjarbdn@gmail.com');

-- 6. Verifikasi hasil
SELECT 
  au.email,
  au.id as user_id,
  tu.role,
  t.name as tenant_name,
  tu.created_at,
  tu.updated_at
FROM auth.users au
LEFT JOIN tenant_users tu ON au.id = tu.user_id
LEFT JOIN tenants t ON tu.tenant_id = t.id
WHERE au.email = 'anjarbdn@gmail.com'
ORDER BY tu.created_at DESC;