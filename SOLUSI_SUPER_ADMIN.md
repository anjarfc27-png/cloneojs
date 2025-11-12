# Solusi: Akun anjarbdn@gmail.com Tidak Redirect ke Admin Dashboard

## Masalah
Setelah login dengan akun `anjarbdn@gmail.com`, user masih di-redirect ke `/dashboard` biasa, bukan ke `/admin/dashboard`. Ini berarti akun tersebut **belum memiliki role `super_admin`** di database.

## Penyebab
Ketika user pertama kali terdaftar, mereka **tidak otomatis menjadi super admin**. Role super admin harus di-setup secara manual di database.

## Solusi (Pilih Salah Satu)

### ✅ Cara 1: Menggunakan Halaman Setup (PALING MUDAH) ⭐

1. **Login dengan akun anjarbdn@gmail.com**
2. **Akses halaman setup:**
   ```
   http://localhost:3000/debug/setup-super-admin
   ```
3. **Klik tombol "Setup Super Admin Role"**
4. **Tunggu sampai muncul pesan sukses**
5. **Otomatis akan redirect ke `/admin/dashboard`**

**Keuntungan:**
- ✅ Tidak perlu akses ke Supabase Dashboard
- ✅ Tidak perlu tahu user_id
- ✅ Otomatis create default tenant jika belum ada
- ✅ Satu klik saja

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

### Cara 3: Menggunakan SQL Script di Supabase

1. **Buka Supabase Dashboard > SQL Editor**
2. **Jalankan script dari file:**
   ```
   supabase/setup-super-admin-simple.sql
   ```
3. **Ikuti instruksi di script untuk mendapatkan user_id**
4. **Jalankan script dengan user_id yang benar**

## Verifikasi Setup

### Check Status via Halaman
1. Login dengan akun yang ingin dicek
2. Akses: `http://localhost:3000/debug/setup-super-admin`
3. Lihat status di halaman

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
  t.name as tenant_name
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role = 'super_admin'
AND tu.is_active = true;
```

## Setelah Setup Berhasil

1. **Logout dari aplikasi**
2. **Login ulang dengan akun anjarbdn@gmail.com**
3. **Expected:** Otomatis redirect ke `/admin/dashboard`
4. **Jika masih redirect ke `/dashboard`:**
   - Clear browser cache dan cookies
   - Check console log untuk error
   - Verify role di database
   - Try incognito mode

## Troubleshooting

### Problem: "User not authenticated"
**Solusi:** 
- Pastikan sudah login dengan akun `anjarbdn@gmail.com`
- Check apakah session masih aktif
- Try logout dan login ulang

### Problem: "Error creating role"
**Solusi:**
- Check console untuk error details
- Pastikan tabel `tenants` dan `tenant_users` sudah ada
- Check RLS policies
- Jalankan SQL script manual

### Problem: "Still redirect to /dashboard"
**Solusi:**
1. Clear browser cache dan cookies
2. Logout dan login ulang
3. Check status di `/debug/setup-super-admin`
4. Verify role di database:
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
- Check apakah policy allow insert/update

## Checklist

- [ ] User sudah terdaftar di Supabase Auth
- [ ] User sudah login setidaknya sekali
- [ ] Tabel `tenants` sudah ada
- [ ] Tabel `tenant_users` sudah ada
- [ ] User memiliki entry di `tenant_users` dengan `role = 'super_admin'`
- [ ] `is_active = true` di `tenant_users`
- [ ] RLS policies sudah dikonfigurasi dengan benar
- [ ] Browser cache sudah di-clear
- [ ] User sudah logout dan login ulang

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
- Redirect logic sudah diimplementasikan di 4 layer (LoginForm, login page, dashboard page, auth guard)



