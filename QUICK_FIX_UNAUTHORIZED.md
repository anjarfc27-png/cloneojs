# ⚡ Quick Fix - Unauthorized Error

## 🔍 Root Cause

Error "Unauthorized" muncul karena:
1. User yang login **belum punya super_admin role assignment** di database
2. Atau role assignment ada tapi `is_active = false`
3. Atau role assignment ada di salah satu table tapi tidak di kedua table (user_role_assignments & tenant_users)

## 🎯 Quick Fix untuk User: anjarbdn@gmail.com

### Step 1: Check Status User
Akses: `http://localhost:3000/api/debug/check-user-role?email=anjarbdn@gmail.com`

### Step 2: Fix Role Assignment
Jalankan file: `supabase/fix-user-role.sql` di Supabase SQL Editor
ATAU copy-paste SQL di bawah ini:

## ✅ Solusi Cepat (3 Langkah)

### Step 1: Check Status User

Buka browser dan akses:
```
http://localhost:3000/api/debug/test-auth
```

Ini akan menampilkan:
- User ID dan email
- Apakah super_admin role ada
- Apakah user punya role assignment
- Diagnosis lengkap

### Step 2: Assign Super Admin Role

**Jika diagnosis menunjukkan user belum punya role assignment**, jalankan SQL ini di Supabase SQL Editor:

```sql
-- GANTI 'YOUR_EMAIL@example.com' dengan email user yang login
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  -- 1. Get user ID dari email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'YOUR_EMAIL@example.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: YOUR_EMAIL@example.com';
  END IF;

  -- 2. Get super_admin role ID
  SELECT id INTO v_role_id 
  FROM roles 
  WHERE role_key = 'super_admin' 
  LIMIT 1;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found. Run migration 004 first.';
  END IF;

  -- 3. Assign role di user_role_assignments (new structure)
  INSERT INTO user_role_assignments (user_id, role_id, is_active, created_at, updated_at)
  VALUES (v_user_id, v_role_id, true, NOW(), NOW())
  ON CONFLICT (user_id, role_id, journal_id, tenant_id) 
  DO UPDATE SET is_active = true, updated_at = NOW();

  -- 4. Assign role di tenant_users (old structure - backward compatibility)
  INSERT INTO tenant_users (user_id, tenant_id, role, is_active, created_at, updated_at)
  VALUES (v_user_id, NULL, 'super_admin', true, NOW(), NOW())
  ON CONFLICT DO UPDATE SET is_active = true, updated_at = NOW();

  RAISE NOTICE '✅ Super admin role assigned successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Role ID: %', v_role_id;
END $$;
```

### Step 3: Test Lagi

1. **Refresh halaman** `/admin/users` (atau logout & login lagi)
2. Error "Unauthorized" seharusnya sudah hilang
3. Users list seharusnya muncul

## 🎯 Auto-Fix Script (Copy-Paste Ready)

Jika ingin langsung fix tanpa ganti email manual, gunakan script ini:

```sql
-- Auto-assign super admin to currently logged in user
-- Run this in Supabase SQL Editor
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the most recent user (assuming it's the one you just logged in with)
  -- OR replace this with specific email
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found';
  END IF;

  RAISE NOTICE 'Assigning super admin to user: % (ID: %)', v_user_email, v_user_id;

  -- Get super_admin role
  SELECT id INTO v_role_id 
  FROM roles 
  WHERE role_key = 'super_admin' 
  LIMIT 1;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found';
  END IF;

  -- Assign role
  INSERT INTO user_role_assignments (user_id, role_id, is_active, created_at, updated_at)
  VALUES (v_user_id, v_role_id, true, NOW(), NOW())
  ON CONFLICT (user_id, role_id, journal_id, tenant_id) 
  DO UPDATE SET is_active = true, updated_at = NOW();

  INSERT INTO tenant_users (user_id, tenant_id, role, is_active, created_at, updated_at)
  VALUES (v_user_id, NULL, 'super_admin', true, NOW(), NOW())
  ON CONFLICT DO UPDATE SET is_active = true, updated_at = NOW();

  RAISE NOTICE '✅ Done! User % is now super admin', v_user_email;
END $$;
```

## 🔍 Troubleshooting

### Masalah: "Super admin role not found"

**Solution**: Jalankan migration 004 dulu:
```sql
-- Copy isi file: supabase/migrations/004_refactor_schema_for_super_admin.sql
-- Paste dan run di Supabase SQL Editor
```

### Masalah: "User not found"

**Solution**: 
1. Check email di Supabase Auth dashboard
2. Atau ganti query untuk get user by ID:
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC;
```

### Masalah: Masih "Unauthorized" setelah assign

**Solution**:
1. **Logout dan login lagi** (refresh session)
2. Clear browser cookies
3. Check console logs untuk error detail
4. Akses `/api/debug/test-auth` untuk verify

## ✅ Verification

Setelah assign role, verify dengan:

```sql
-- Check user role assignment
SELECT 
  u.email,
  r.role_key,
  r.name,
  ura.is_active,
  ura.created_at
FROM auth.users u
JOIN user_role_assignments ura ON ura.user_id = u.id
JOIN roles r ON r.id = ura.role_id
WHERE r.role_key = 'super_admin'
  AND ura.is_active = true;
```

Seharusnya muncul user Anda dengan role super_admin.

---

**Setelah fix, halaman `/admin/users` seharusnya sudah bisa diakses!** 🎉

