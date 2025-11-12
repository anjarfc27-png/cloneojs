# Setup Super Admin - Panduan Lengkap

## Masalah
Setelah login dengan akun `anjarbdn@gmail.com`, user masih di-redirect ke `/dashboard` biasa, bukan ke `/admin/dashboard`. Ini berarti akun tersebut belum memiliki role `super_admin` di database.

## Solusi

### Cara 1: Menggunakan Halaman Debug (Paling Mudah) ⭐

1. **Login dengan akun anjarbdn@gmail.com**
2. **Akses halaman setup:**
   ```
   http://localhost:3000/debug/setup-super-admin
   ```
3. **Klik tombol "Setup Super Admin Role"**
4. **Tunggu sampai selesai**
5. **Otomatis redirect ke `/admin/dashboard`**

### Cara 2: Menggunakan API Endpoint

1. **Login dengan akun anjarbdn@gmail.com**
2. **Buka browser console (F12)**
3. **Jalankan command:**
   ```javascript
   fetch('/api/debug/setup-super-admin-v2', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'anjarbdn@gmail.com' })
   })
   .then(r => r.json())
   .then(console.log)
   ```
4. **Refresh halaman dan login ulang**

### Cara 3: Menggunakan SQL Script (Manual)

1. **Buka Supabase Dashboard > SQL Editor**
2. **Jalankan script berikut:**

```sql
-- Step 1: Buat default tenant jika belum ada
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Cari user_id dari Supabase Auth dashboard
-- Buka: Authentication > Users > Cari anjarbdn@gmail.com > Copy User UUID

-- Step 3: Setup super admin (ganti USER_ID_HERE dengan UUID dari Step 2)
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
SELECT 
  'USER_ID_HERE'::UUID,  -- GANTI INI dengan user_id yang sebenarnya
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
  t.name as tenant_name,
  tu.created_at
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role = 'super_admin'
AND tu.is_active = true;
```

### Cara 4: Menggunakan Supabase Dashboard (Manual)

1. **Buka Supabase Dashboard > Authentication > Users**
2. **Cari user dengan email `anjarbdn@gmail.com`**
3. **Copy User UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)**
4. **Buka Supabase Dashboard > Table Editor > `tenant_users`**
5. **Klik "Insert row"**
6. **Isi data:**
   - `user_id`: Paste UUID dari Step 3
   - `tenant_id`: Cari ID dari tabel `tenants` dengan slug `default-journal`
   - `role`: `super_admin`
   - `is_active`: `true`
7. **Klik "Save"**

## Verifikasi

### Check Status via API
```bash
# GET request ke endpoint check
curl http://localhost:3000/api/debug/setup-super-admin-v2
```

### Check Status via SQL
```sql
-- Check apakah user adalah super admin
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

### Check Status via Halaman
1. Login dengan akun yang ingin dicek
2. Akses: `http://localhost:3000/debug/setup-super-admin`
3. Lihat status di halaman

## Troubleshooting

### Problem: "User not found"
**Solusi:**
- Pastikan user sudah terdaftar di Supabase Auth
- Check apakah email benar: `anjarbdn@gmail.com`
- Pastikan user sudah login setidaknya sekali

### Problem: "Error creating tenant"
**Solusi:**
- Check apakah tabel `tenants` sudah ada
- Check apakah slug `default-journal` sudah digunakan
- Run SQL script untuk create tenant manual

### Problem: "Error creating role"
**Solusi:**
- Check apakah `user_id` benar
- Check apakah `tenant_id` ada
- Check apakah `role = 'super_admin'` valid (enum type)
- Check RLS policies

### Problem: "Redirect masih ke /dashboard"
**Solusi:**
1. **Clear browser cache dan cookies**
2. **Logout dan login ulang**
3. **Check console log untuk error messages**
4. **Verify role di database:**
   ```sql
   SELECT * FROM tenant_users 
   WHERE user_id = 'YOUR_USER_ID' 
   AND role = 'super_admin' 
   AND is_active = true;
   ```

### Problem: "RLS Policy Error"
**Solusi:**
- Check RLS policies di tabel `tenant_users`
- Pastikan policy allow read untuk user yang sedang login
- Check apakah policy allow insert/update untuk super admin setup

## Checklist

- [ ] User sudah terdaftar di Supabase Auth
- [ ] User sudah login setidaknya sekali
- [ ] Tabel `tenants` sudah ada dan memiliki default tenant
- [ ] Tabel `tenant_users` sudah ada
- [ ] User memiliki entry di `tenant_users` dengan `role = 'super_admin'`
- [ ] `is_active = true` di `tenant_users`
- [ ] RLS policies sudah dikonfigurasi dengan benar
- [ ] Browser cache sudah di-clear
- [ ] User sudah logout dan login ulang

## Setelah Setup Berhasil

1. **Logout dari aplikasi**
2. **Login ulang dengan akun anjarbdn@gmail.com**
3. **Expected:** Otomatis redirect ke `/admin/dashboard`
4. **Jika masih redirect ke `/dashboard`:**
   - Check console log untuk error
   - Verify role di database
   - Clear cache dan cookies
   - Try incognito mode

## Link Penting

- **Setup Page:** http://localhost:3000/debug/setup-super-admin
- **Admin Dashboard:** http://localhost:3000/admin/dashboard
- **Check Status API:** http://localhost:3000/api/debug/setup-super-admin-v2
- **Supabase Dashboard:** https://app.supabase.com

## Catatan

- Super admin setup hanya bisa dilakukan oleh user yang sudah login
- Setup akan create default tenant jika belum ada
- Setup akan update role jika user sudah memiliki role di tenant
- Setup akan create new entry jika user belum memiliki role di tenant
- Setelah setup, user perlu logout dan login ulang untuk perubahan berlaku



