# Super Admin Redirect Implementation

## Overview
Implementasi redirect otomatis untuk super admin ke `/admin/dashboard` setelah login.

## Perubahan yang Dilakukan

### 1. LoginForm.tsx
- ✅ Check role setelah login berhasil
- ✅ Redirect super admin ke `/admin/dashboard`
- ✅ Redirect user biasa ke `/dashboard`

### 2. login/page.tsx (Server Component)
- ✅ Check role jika user sudah login
- ✅ Redirect super admin ke `/admin/dashboard`
- ✅ Redirect user biasa ke `/dashboard`

### 3. dashboard/page.tsx (Server Component)
- ✅ Check role sebelum render dashboard
- ✅ Redirect super admin ke `/admin/dashboard`
- ✅ Render dashboard untuk user biasa

### 4. DashboardAuthGuard.tsx (Client Component)
- ✅ Check role di auth guard
- ✅ Redirect super admin ke `/admin/dashboard` menggunakan `window.location.href`
- ✅ Render dashboard untuk user biasa

## Alur Redirect

### Setelah Login
1. User login dengan email/password
2. System check role dari `tenant_users` table
3. Jika `role = 'super_admin'` → redirect ke `/admin/dashboard`
4. Jika bukan super admin → redirect ke `/dashboard`

### Akses Manual ke Dashboard
1. Super admin akses `/dashboard`
2. System check role
3. Redirect ke `/admin/dashboard`

### Akses Manual ke Login (Sudah Login)
1. Super admin akses `/login`
2. System check role
3. Redirect ke `/admin/dashboard`

## Testing

### Test Case 1: Login sebagai Super Admin
1. Buka `/login`
2. Login dengan akun super admin (`anjarbdn@gmail.com`)
3. **Expected:** Redirect ke `/admin/dashboard`

### Test Case 2: Login sebagai User Biasa
1. Buka `/login`
2. Login dengan akun biasa
3. **Expected:** Redirect ke `/dashboard`

### Test Case 3: Super Admin Akses `/dashboard`
1. Login sebagai super admin
2. Akses `/dashboard` langsung
3. **Expected:** Redirect ke `/admin/dashboard`

### Test Case 4: Super Admin Akses `/login` (Sudah Login)
1. Login sebagai super admin
2. Akses `/login` langsung
3. **Expected:** Redirect ke `/admin/dashboard`

## Notes

- Semua check role menggunakan query ke `tenant_users` table
- Filter: `user_id = user.id AND is_active = true AND role = 'super_admin'`
- Redirect menggunakan `window.location.href` untuk client component
- Redirect menggunakan `redirect()` untuk server component
- Error handling: Jika error check role, assume bukan super admin

## Security

- ✅ Super admin check dilakukan di multiple layers
- ✅ Server-side check di `dashboard/page.tsx` dan `login/page.tsx`
- ✅ Client-side check di `DashboardAuthGuard.tsx` dan `LoginForm.tsx`
- ✅ Admin routes protected by `requireSuperAdmin()` middleware

## Troubleshooting

### Super Admin Tidak Redirect
1. Check apakah user memiliki role `super_admin` di `tenant_users`
2. Check apakah `is_active = true`
3. Check console log untuk error messages
4. Verify user_id matches dengan auth.users

### Error: "Error checking role"
- Ini normal jika user bukan super admin
- Check console untuk details
- Verify database connection

### Redirect Loop
- Pastikan `/admin/dashboard` tidak redirect kembali ke `/dashboard`
- Check `requireSuperAdmin()` tidak throw error
- Verify RLS policies allow access



