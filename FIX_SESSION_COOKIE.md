# 🔧 Fix "Auth session missing!" Error

## 🔍 Masalah

Dari debug response:
- ✅ Cookies ada: `sb-cqaefitmerciqcneksqm-auth-token`
- ❌ Error: "Auth session missing!"
- ❌ `hasUser: false`

**Root Cause**: Cookie ada tapi Supabase tidak bisa decode session dari cookie tersebut.

## ✅ Solusi

### Step 1: Logout & Login Lagi (Paling Cepat)

1. **Logout** dari aplikasi
2. **Clear browser cookies** (F12 → Application → Cookies → Clear All)
3. **Login lagi** dengan email `anjarbdn@gmail.com`
4. **Tunggu 2-3 detik** setelah login (untuk cookie sync)
5. **Akses** `/admin/users` lagi

### Step 2: Check Session di Browser

Buka browser console (F12) dan jalankan:
```javascript
// Check session di client-side
const supabase = window.supabase || (await import('@/lib/supabase/client')).createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

Jika session ada di client tapi tidak di server, berarti ada masalah cookie sync.

### Step 3: Verify Cookie Format

Check apakah cookie ter-set dengan benar:
1. F12 → Application → Cookies → `localhost:3000`
2. Cari cookie yang namanya mengandung `supabase` atau `auth`
3. Check apakah value tidak kosong
4. Check apakah `HttpOnly` dan `Secure` flags sesuai

## 🔧 Perbaikan yang Sudah Dilakukan

1. ✅ **Added session refresh** di `checkSuperAdmin()` - akan coba refresh session jika tidak ada
2. ✅ **Added logging** untuk debug cookie dan session
3. ✅ **Added session check** di `createClient()` untuk verify session

## 🎯 Quick Test

Setelah logout & login lagi, test:

1. **Check session**: `http://localhost:3000/api/debug/check-session`
   - Seharusnya: `hasUser: true`

2. **Test checkSuperAdmin**: `http://localhost:3000/api/debug/test-check-super-admin`
   - Seharusnya: `authorized: true`

3. **Akses halaman**: `/admin/users`
   - Seharusnya: Tidak ada error "Unauthorized"

## 🚨 Jika Masih Tidak Bekerja

Jika setelah logout & login masih error, kemungkinan:
1. **Cookie domain/path issue** - Check cookie settings
2. **HTTPS vs HTTP issue** - Check apakah `Secure` flag sesuai
3. **SameSite cookie issue** - Check browser settings

**Workaround**: Gunakan API route untuk data fetching instead of Server Actions (jika masalah persist).

---

**Silakan coba logout & login lagi, lalu test endpoint debug!**

