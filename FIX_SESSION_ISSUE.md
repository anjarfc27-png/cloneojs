# 🔧 Fix Session Issue - Server Actions Tidak Dapat User

## 🔍 Masalah

Server Actions yang dipanggil dari client component (`'use client'`) tidak bisa mendapatkan user session:
- `hasUser: false` di `checkSuperAdmin()`
- Error "Unauthorized" muncul
- Padahal user sudah login dan punya role super_admin

## 🎯 Root Cause

**Server Actions di Next.js 14** yang dipanggil dari client component **harus** memiliki akses ke cookies, tapi ada kemungkinan:
1. Cookies tidak ter-sync antara client dan server
2. Server Action context tidak mendapatkan cookies dengan benar
3. Timing issue - cookies belum ter-sync saat Server Action dipanggil

## ✅ Solusi

### Step 1: Check Session di API Route

Akses: `http://localhost:3000/api/debug/check-session`

Ini akan menampilkan:
- Apakah cookies ada
- Apakah user terdeteksi di API route context
- Detail cookies yang ada

### Step 2: Test checkSuperAdmin di API Route

Akses: `http://localhost:3000/api/debug/test-check-super-admin`

Ini akan test `checkSuperAdmin()` di API route context (bukan Server Action).

### Step 3: Perbaikan yang Sudah Dilakukan

1. ✅ **Added logging** di `checkSuperAdmin()` untuk debug
2. ✅ **Added logging** di `createClient()` untuk melihat cookies
3. ✅ **Added error handling** yang lebih baik

### Step 4: Workaround - Refresh Session

Jika masih tidak bekerja, coba:

1. **Logout dan login lagi** - refresh session
2. **Clear browser cookies** dan login lagi
3. **Hard refresh** (Ctrl+Shift+R) setelah login
4. **Tunggu beberapa detik** setelah login sebelum akses admin pages

## 🔍 Debugging Steps

### 1. Check Cookies
Akses: `http://localhost:3000/api/debug/check-session`

Lihat apakah:
- `hasAuthCookies: true`
- `hasUser: true`

### 2. Check Terminal Logs
Lihat terminal dimana dev server berjalan, cari:
- `[createClient] Cookies found: X`
- `[checkSuperAdmin] Starting authorization check...`
- `[checkSuperAdmin] Getting user from session...`

### 3. Check Browser Console
Buka browser console (F12), lihat:
- Apakah ada error di client-side
- Apakah Server Action dipanggil dengan benar

## 🚨 Common Issues

### Issue 1: Cookies Tidak Ada

**Symptoms**: `hasAuthCookies: false` di `/api/debug/check-session`

**Solution**:
1. Logout dan login lagi
2. Check apakah login berhasil (lihat console logs)
3. Check apakah cookies ter-set di browser (F12 → Application → Cookies)

### Issue 2: User Tidak Terdeteksi di Server Action

**Symptoms**: `hasUser: false` di Server Action tapi `true` di API route

**Solution**:
- Ini adalah known issue dengan Next.js 14 Server Actions
- Workaround: Gunakan API route untuk data fetching, atau pastikan cookies ter-sync

### Issue 3: Timing Issue

**Symptoms**: Kadang bekerja, kadang tidak

**Solution**:
- Tambahkan delay sebelum memanggil Server Action
- Atau gunakan `useTransition` untuk handle loading state

## 📝 Next Steps

1. **Test endpoint debug** untuk melihat status session
2. **Check terminal logs** untuk detail error
3. **Coba logout & login lagi** untuk refresh session
4. **Jika masih tidak bekerja**, kita bisa ubah approach:
   - Gunakan API route instead of Server Actions
   - Atau fetch data di Server Component, bukan Client Component

---

**Silakan test endpoint debug dan kirim hasilnya!**

