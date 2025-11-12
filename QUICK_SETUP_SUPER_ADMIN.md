# Quick Setup Super Admin - anjarbdn@gmail.com

## ⚡ Cara Tercepat (Recommended)

### Step 1: Login
1. Login dengan akun `anjarbdn@gmail.com`
2. Pastikan login berhasil

### Step 2: Setup Super Admin
1. Buka browser dan akses:
   ```
   http://localhost:3000/debug/setup-super-admin
   ```
2. Klik tombol **"Setup Super Admin Role"**
3. Tunggu sampai muncul pesan sukses
4. Otomatis akan redirect ke `/admin/dashboard`

### Step 3: Verifikasi
1. Pastikan sudah di-redirect ke `/admin/dashboard`
2. Jika masih di `/dashboard`, logout dan login ulang

## 🔍 Check Status

### Via Halaman
1. Akses: `http://localhost:3000/debug/setup-super-admin`
2. Lihat status di halaman

### Via API
1. Buka browser console (F12)
2. Jalankan:
   ```javascript
   fetch('/api/debug/setup-super-admin-v2')
     .then(r => r.json())
     .then(console.log)
   ```

## 🛠️ Troubleshooting

### Masalah: "User not authenticated"
**Solusi:** Pastikan sudah login dengan akun `anjarbdn@gmail.com`

### Masalah: "Error creating role"
**Solusi:** 
1. Check console untuk error details
2. Pastikan tabel `tenants` dan `tenant_users` sudah ada
3. Jalankan SQL script manual (lihat di bawah)

### Masalah: "Still redirect to /dashboard"
**Solusi:**
1. Clear browser cache dan cookies
2. Logout dan login ulang
3. Check status di `/debug/setup-super-admin`
4. Verify role di database

## 📝 SQL Script Manual (Jika cara di atas tidak bekerja)

1. **Buka Supabase Dashboard > SQL Editor**
2. **Jalankan script ini:**

```sql
-- Step 1: Buat default tenant
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Dapatkan user_id
-- Buka: Authentication > Users > Cari anjarbdn@gmail.com > Copy UUID

-- Step 3: Setup super admin (GANTI USER_ID_HERE dengan UUID dari Step 2)
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
SELECT 
  'USER_ID_HERE'::UUID,  -- GANTI INI
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

-- Step 4: Verifikasi
SELECT 
  tu.user_id,
  tu.role,
  tu.is_active,
  t.name as tenant_name
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role = 'super_admin'
AND tu.is_active = true;
```

## ✅ Checklist

- [ ] User sudah login dengan `anjarbdn@gmail.com`
- [ ] Akses `/debug/setup-super-admin`
- [ ] Klik "Setup Super Admin Role"
- [ ] Lihat pesan sukses
- [ ] Otomatis redirect ke `/admin/dashboard`
- [ ] Bisa akses semua fitur admin

## 🎯 Expected Result

Setelah setup berhasil:
- ✅ Login dengan `anjarbdn@gmail.com` → redirect ke `/admin/dashboard`
- ✅ Bisa akses semua halaman admin
- ✅ Bisa manage users, journals, settings, dll

## 📞 Need Help?

Jika masih ada masalah:
1. Check console log untuk error messages
2. Check status di `/debug/setup-super-admin`
3. Verify role di database menggunakan SQL query
4. Check RLS policies di Supabase



