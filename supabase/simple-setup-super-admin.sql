-- Simple Setup Super Admin untuk Supabase
-- Jalankan script ini langsung di Supabase Dashboard > SQL Editor

-- 1. Buat tenant default jika belum ada
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Dapatkan ID tenant default
DO $$
DECLARE
  target_email TEXT := 'anjarbdn@gmail.com';
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
    RAISE NOTICE 'User tidak ditemukan: %', target_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'User ditemukan: % dengan ID: %', target_email, target_user_id;
  
  -- Dapatkan default tenant ID
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE slug = 'default-journal' 
  LIMIT 1;
  
  RAISE NOTICE 'Tenant ID: %', default_tenant_id;
  
  -- Buat journal default untuk tenant
  INSERT INTO journals (tenant_id, title, description, abbreviation, language, is_active)
  SELECT 
    default_tenant_id,
    'Default Journal',
    'Default journal for super admin management',
    'DJ',
    'id',
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM journals j WHERE j.tenant_id = default_tenant_id
  );
  
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
    
    RAISE NOTICE 'Role diupdate menjadi super_admin untuk: %', target_email;
  ELSE
    -- Insert baru jika belum ada
    INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
    VALUES (target_user_id, default_tenant_id, 'super_admin', true);
    
    RAISE NOTICE 'Super admin berhasil dibuat untuk: %', target_email;
  END IF;
END $$;

-- 3. Verifikasi hasil
SELECT 
  au.email,
  au.id as user_id,
  tu.role,
  t.name as tenant_name,
  t.slug as tenant_slug,
  tu.created_at,
  tu.updated_at
FROM auth.users au
LEFT JOIN tenant_users tu ON au.id = tu.user_id
LEFT JOIN tenants t ON tu.tenant_id = t.id
WHERE au.email = 'anjarbdn@gmail.com'
ORDER BY tu.created_at DESC;

-- 4. Lihat semua super admin
SELECT 
  au.email,
  au.created_at as user_created,
  tu.role,
  t.name as tenant_name,
  tu.created_at as role_created
FROM tenant_users tu
JOIN auth.users au ON tu.user_id = au.id
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role = 'super_admin'
ORDER BY tu.created_at DESC;