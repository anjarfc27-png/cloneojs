-- Manual Setup Super Admin untuk Supabase
-- Jalankan script ini langsung di Supabase Dashboard > SQL Editor

-- Fungsi untuk setup super admin
CREATE OR REPLACE FUNCTION manual_setup_super_admin(target_email TEXT)
RETURNS TABLE (
  status TEXT,
  message TEXT,
  user_id UUID,
  tenant_id UUID
) AS $$
DECLARE
  target_user_id UUID;
  default_tenant_id UUID;
  existing_role TEXT;
BEGIN
  -- 1. Cari user_id berdasarkan email
  SELECT au.id INTO target_user_id 
  FROM auth.users au 
  WHERE au.email = target_email
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT 'error', 'User tidak ditemukan: ' || target_email, NULL, NULL;
    RETURN;
  END IF;
  
  -- 2. Buat atau dapatkan default tenant
  INSERT INTO tenants (name, slug, description, is_active)
  VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
  ON CONFLICT (slug) DO NOTHING;
  
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE slug = 'default-journal' 
  LIMIT 1;
  
  -- 3. Buat journal default untuk tenant
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
  
  -- 4. Cek apakah user sudah memiliki role di tenant ini
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
    
    RETURN QUERY SELECT 'success', 'Role diupdate menjadi super_admin untuk: ' || target_email, target_user_id, default_tenant_id;
  ELSE
    -- Insert baru jika belum ada
    INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
    VALUES (target_user_id, default_tenant_id, 'super_admin', true);
    
    RETURN QUERY SELECT 'success', 'Super admin berhasil dibuat untuk: ' || target_email, target_user_id, default_tenant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Jalankan setup untuk anjarbdn@gmail.com
SELECT * FROM manual_setup_super_admin('anjarbdn@gmail.com');

-- Verifikasi hasil
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

-- Lihat semua super admin
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