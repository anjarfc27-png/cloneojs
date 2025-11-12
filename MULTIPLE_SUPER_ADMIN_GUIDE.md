# 👥 Panduan Multiple Super Admin - Untuk Penggunaan di Indonesia

## 📋 Overview

Sistem ini **mendukung banyak super admin users** untuk penggunaan di Indonesia. Setiap super admin memiliki akses penuh ke sistem.

## 🏗️ Arsitektur

### Role Definition (Hanya 1)
- **Table**: `roles`
- **Constraint**: Hanya boleh ada **1 role definition** dengan `role_key = 'super_admin'`
- **Purpose**: Definisi role, bukan user assignment

### User Assignments (Banyak Users)
- **Table**: `user_role_assignments`
- **Constraint**: Bisa ada **banyak users** dengan role `super_admin`
- **Purpose**: Assign role ke users

## ✅ Cara Assign Super Admin ke User Baru

### Method 1: Via SQL (Recommended untuk Setup Awal)

```sql
-- 1. Get user ID
SELECT id, email FROM auth.users WHERE email = 'email@example.com';

-- 2. Get super_admin role ID
SELECT id FROM roles WHERE role_key = 'super_admin' AND is_active = true LIMIT 1;

-- 3. Assign role (ganti USER_ID dan ROLE_ID)
INSERT INTO user_role_assignments (user_id, role_id, is_active)
VALUES ('USER_ID', 'ROLE_ID', true)
ON CONFLICT (user_id, role_id, journal_id, tenant_id) DO UPDATE
SET is_active = true, updated_at = NOW();

-- 4. Juga assign ke tenant_users untuk backward compatibility
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
VALUES ('USER_ID', NULL, 'super_admin', true)
ON CONFLICT DO NOTHING;
```

### Method 2: Via Server Action (Setelah UI Ready)

Gunakan Server Action `assignUserRole` dari `actions/users/roles.ts`:

```typescript
import { assignUserRole } from '@/actions/users/roles'

const result = await assignUserRole({
  user_id: 'user-id',
  role_key: 'super_admin',
  journal_id: null, // null untuk site-level role
  tenant_id: null,  // null untuk site-level role
})
```

### Method 3: Via Admin UI (Setelah Halaman Users Ready)

1. Buka `/admin/users`
2. Klik "Tambah Pengguna" atau edit user yang sudah ada
3. Assign role "Super Admin"
4. Save

## 🔍 Check Super Admin Users

### Query untuk List Semua Super Admin

```sql
-- List semua users dengan role super_admin
SELECT 
  u.id,
  u.email,
  ura.created_at as assigned_at,
  ura.is_active
FROM auth.users u
JOIN user_role_assignments ura ON ura.user_id = u.id
JOIN roles r ON r.id = ura.role_id
WHERE r.role_key = 'super_admin'
  AND ura.is_active = true
ORDER BY ura.created_at DESC;
```

### Query untuk Check Apakah User adalah Super Admin

```sql
-- Check apakah user tertentu adalah super admin
SELECT EXISTS (
  SELECT 1
  FROM user_role_assignments ura
  JOIN roles r ON r.id = ura.role_id
  WHERE ura.user_id = 'USER_ID'
    AND r.role_key = 'super_admin'
    AND ura.is_active = true
) as is_super_admin;
```

## 🚫 Remove Super Admin Role dari User

```sql
-- Deactivate super admin role (soft delete)
UPDATE user_role_assignments
SET is_active = false, updated_at = NOW()
WHERE user_id = 'USER_ID'
  AND role_id = (SELECT id FROM roles WHERE role_key = 'super_admin' LIMIT 1);

-- Juga update tenant_users untuk backward compatibility
UPDATE tenant_users
SET is_active = false, updated_at = NOW()
WHERE user_id = 'USER_ID'
  AND role = 'super_admin';
```

## 🔐 Authorization Check

Sistem sudah support multiple super admin melalui:

1. **`checkSuperAdmin()`** - Check apakah user adalah super admin
   - Menggunakan admin client untuk bypass RLS
   - Check di `user_role_assignments` dengan role `super_admin`
   - Backward compatible dengan `tenant_users`

2. **`requireSuperAdmin()`** - Require super admin, redirect jika tidak
   - Digunakan di layout untuk protect admin pages
   - Support multiple super admin users

## 📊 Best Practices

### 1. Audit Trail
- Semua super admin actions dicatat di `activity_logs`
- Track siapa yang melakukan apa dan kapan

### 2. Security
- Jangan assign super admin role secara sembarangan
- Review super admin users secara berkala
- Deactivate super admin yang tidak aktif lagi

### 3. Monitoring
- Monitor jumlah super admin users
- Track super admin activities
- Alert jika ada suspicious activities

## 🐛 Troubleshooting

### Issue: User tidak bisa akses admin meskipun sudah assign role

**Solution**:
1. Check apakah role assignment `is_active = true`
2. Check apakah role definition `is_active = true`
3. Logout dan login lagi untuk refresh session
4. Check console logs untuk error messages

### Issue: Duplicate role definitions

**Solution**:
- Jalankan migration `005_fix_duplicate_super_admin_roles.sql`
- Migration akan cleanup duplicate dan migrasikan assignments

### Issue: Authorization check gagal

**Solution**:
1. Check apakah `SUPABASE_SERVICE_ROLE_KEY` sudah di-set
2. Check apakah admin client bisa akses database
3. Check RLS policies tidak memblokir query

## 📝 Migration Notes

### Migration 004: Refactor Schema
- Membuat table `roles` dengan UNIQUE constraint pada `role_key`
- Membuat table `user_role_assignments` untuk user-role assignments
- Support multiple users dengan role yang sama

### Migration 005: Fix Duplicate Roles
- Cleanup duplicate role definitions (hanya 1 role definition per role_key)
- Migrate assignments dari duplicate roles ke role yang dipertahankan
- **Tidak membatasi jumlah users dengan role super_admin**

## ✅ Checklist Setup Multiple Super Admin

- [ ] Migration 004 sudah dijalankan
- [ ] Migration 005 sudah dijalankan (jika ada duplicate roles)
- [ ] Role `super_admin` sudah ada di table `roles`
- [ ] User pertama sudah di-assign role super_admin
- [ ] Test authorization check berfungsi
- [ ] Test admin pages bisa diakses
- [ ] Assign super admin ke user kedua untuk test
- [ ] Verify kedua users bisa akses admin pages

## 🎯 Contoh Use Case Indonesia

### Scenario: Multiple Universities/Institutions

```
- Universitas A: 2 super admin (rektor + IT head)
- Universitas B: 2 super admin (rektor + IT head)
- Platform Admin: 3 super admin (platform owner + 2 tech leads)

Total: 7 super admin users, semua bisa akses full system
```

### Scenario: Regional Management

```
- Jakarta Region: 2 super admin
- Bandung Region: 2 super admin
- Surabaya Region: 2 super admin
- Central Admin: 3 super admin

Total: 9 super admin users
```

Semua scenario di atas **didukung** oleh sistem ini! 🎉

---

**Update**: Sistem sudah siap untuk multiple super admin users. Pastikan hanya ada 1 role definition, tapi bisa assign ke banyak users.

