# Setup Super Admin untuk anjarbdn@gmail.com

## ✅ User ID Anda
```
655ca435-ea20-4dea-817e-4ae1bdf8e86c
```

## 🚀 Cara Tercepat (Recommended)

### Opsi 1: Menggunakan Halaman Setup (PALING MUDAH)
1. **Login dengan akun `anjarbdn@gmail.com`**
2. **Buka browser dan akses:**
   ```
   http://localhost:3000/debug/setup-super-admin
   ```
3. **Klik tombol "Setup Super Admin Role"**
4. **Tunggu sampai muncul pesan sukses**
5. **Otomatis akan redirect ke `/admin/dashboard`**

### Opsi 2: Menggunakan SQL Script (Langsung)
1. **Buka Supabase Dashboard > SQL Editor**
2. **Copy dan jalankan script dari file:**
   ```
   supabase/setup-super-admin-anjarbdn.sql
   ```
3. **Atau copy script di bawah ini:**
   ```sql
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

   -- Step 3: Verifikasi
   SELECT 
     tu.user_id,
     tu.role,
     tu.is_active,
     t.name as tenant_name
   FROM tenant_users tu
   JOIN tenants t ON tu.tenant_id = t.id
   WHERE tu.user_id = '655ca435-ea20-4dea-817e-4ae1bdf8e86c'::UUID;
   ```
4. **Pastikan query Step 3 mengembalikan 1 row dengan `role = 'super_admin'`**
5. **Logout dan login ulang di aplikasi**

### Opsi 3: Menggunakan API Endpoint
1. **Login dengan akun `anjarbdn@gmail.com`**
2. **Buka browser console (F12)**
3. **Jalankan command:**
   ```javascript
   fetch('/api/debug/setup-super-admin-direct', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       user_id: '655ca435-ea20-4dea-817e-4ae1bdf8e86c',
       email: 'anjarbdn@gmail.com'
     })
   })
   .then(r => r.json())
   .then(console.log)
   ```
4. **Refresh halaman dan login ulang**

## 🔍 Verifikasi Setup

### Check Status via Halaman
1. Login dengan akun `anjarbdn@gmail.com`
2. Akses: `http://localhost:3000/debug/setup-super-admin`
3. Lihat status di halaman - harus menunjukkan `is_super_admin: true`

### Check Status via API
```bash
# Di browser console (F12)
fetch('/api/debug/setup-super-admin-v2')
  .then(r => r.json())
  .then(console.log)
```

### Check Status via SQL
```sql
-- Check apakah user adalah super admin
SELECT 
  tu.user_id,
  tu.role,
  tu.is_active,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.user_id = '655ca435-ea20-4dea-817e-4ae1bdf8e86c'::UUID
AND tu.role = 'super_admin'
AND tu.is_active = true;
```

**Expected Result:** Harus mengembalikan 1 row dengan:
- `user_id = '655ca435-ea20-4dea-817e-4ae1bdf8e86c'`
- `role = 'super_admin'`
- `is_active = true`

## ✅ Setelah Setup Berhasil

1. **Logout dari aplikasi**
2. **Login ulang dengan akun `anjarbdn@gmail.com`**
3. **Expected:** Otomatis redirect ke `/admin/dashboard`
4. **Bisa akses semua fitur admin:**
   - Dashboard
   - User Management
   - Journal Management
   - Settings
   - System Information
   - Activity Log
   - Email Templates
   - Announcements
   - Statistics & Reports

## 🛠️ Troubleshooting

### Problem: "User not authenticated"
**Solusi:** 
- Pastikan sudah login dengan akun `anjarbdn@gmail.com`
- Check apakah session masih aktif
- Try logout dan login ulang

### Problem: "Error creating role" atau "RLS Policy Error"
**Solusi:**
1. Check console untuk error details
2. Pastikan tabel `tenants` dan `tenant_users` sudah ada
3. Check RLS policies di Supabase
4. Jalankan SQL script manual (Opsi 2)

### Problem: "Still redirect to /dashboard"
**Solusi:**
1. Clear browser cache dan cookies
2. Logout dan login ulang
3. Check status di `/debug/setup-super-admin`
4. Verify role di database menggunakan SQL query di atas
5. Pastikan `is_active = true` di `tenant_users`

### Problem: "No rows returned" pada verifikasi SQL
**Solusi:**
1. Pastikan script SQL sudah dijalankan dengan benar
2. Check apakah user_id benar: `655ca435-ea20-4dea-817e-4ae1bdf8e86c`
3. Check apakah default tenant sudah dibuat
4. Jalankan script lagi jika perlu

## 📋 Checklist

- [ ] User sudah terdaftar di Supabase Auth dengan email `anjarbdn@gmail.com`
- [ ] User ID: `655ca435-ea20-4dea-817e-4ae1bdf8e86c`
- [ ] Tabel `tenants` sudah ada
- [ ] Tabel `tenant_users` sudah ada
- [ ] Default tenant dengan slug `default-journal` sudah dibuat
- [ ] User memiliki entry di `tenant_users` dengan:
  - `user_id = '655ca435-ea20-4dea-817e-4ae1bdf8e86c'`
  - `role = 'super_admin'`
  - `is_active = true`
- [ ] RLS policies sudah dikonfigurasi dengan benar
- [ ] Browser cache sudah di-clear
- [ ] User sudah logout dan login ulang
- [ ] Redirect ke `/admin/dashboard` berhasil

## 🎯 Expected Result

Setelah setup berhasil:
- ✅ Login dengan `anjarbdn@gmail.com` → redirect ke `/admin/dashboard`
- ✅ Bisa akses semua halaman admin
- ✅ Bisa manage users, journals, settings, dll
- ✅ Status di `/debug/setup-super-admin` menunjukkan `is_super_admin: true`

## 📞 Need Help?

Jika masih ada masalah:
1. Check console log untuk error messages
2. Check status di `/debug/setup-super-admin`
3. Verify role di database menggunakan SQL query
4. Check RLS policies di Supabase
5. Pastikan user_id benar: `655ca435-ea20-4dea-817e-4ae1bdf8e86c`

## 📁 File yang Digunakan

- **SQL Script:** `supabase/setup-super-admin-anjarbdn.sql`
- **Setup Page:** `http://localhost:3000/debug/setup-super-admin`
- **API Endpoint:** `/api/debug/setup-super-admin-direct`
- **Check Status API:** `/api/debug/setup-super-admin-v2`

## 🎉 Quick Start

**Cara tercepat:**
1. Login dengan `anjarbdn@gmail.com`
2. Buka: `http://localhost:3000/debug/setup-super-admin`
3. Klik "Setup Super Admin Role"
4. Selesai! Redirect ke `/admin/dashboard`



