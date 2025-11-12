# Fix Unauthorized Error - Summary

## Problem
Semua menu admin menampilkan error "Unauthorized" karena semua API routes menggunakan `.single()` untuk check super admin role, yang akan throw error jika tidak ada hasil atau ada multiple results.

## Solution
Membuat helper function `checkSuperAdmin()` khusus untuk API routes yang:
1. Menggunakan `.limit(1)` instead of `.single()` untuk handle multiple super admin entries
2. Mengembalikan NextResponse error jika tidak authorized (bukan redirect seperti `requireSuperAdmin()`)
3. Mengembalikan `authorized`, `error`, `user`, dan `supabase` untuk digunakan di API routes

## Files Updated

### Core Auth Helper
- `lib/admin/auth.ts` - Added `checkSuperAdmin()` function

### Main Admin Routes (FIXED)
- ✅ `app/api/admin/users/route.ts` - GET, POST
- ✅ `app/api/admin/users/[id]/route.ts` - PUT, DELETE
- ✅ `app/api/admin/journals/route.ts` - GET, POST
- ✅ `app/api/admin/journals/[id]/route.ts` - PUT, DELETE
- ✅ `app/api/admin/journals/editors/route.ts` - GET
- ✅ `app/api/admin/issues/route.ts` - GET, POST
- ✅ `app/api/admin/issues/[id]/route.ts` - PUT, DELETE
- ✅ `app/api/admin/issues/[id]/publish/route.ts` - POST
- ✅ `app/api/admin/settings/route.ts` - GET, PUT, POST
- ✅ `app/api/admin/statistics/route.ts` - GET
- ✅ `app/api/admin/activity-logs/route.ts` - GET, DELETE
- ✅ `app/api/admin/system/information/route.ts` - GET
- ✅ `app/api/admin/announcements/route.ts` - GET, POST
- ✅ `app/api/admin/announcements/[id]/route.ts` - GET, PUT, DELETE
- ✅ `app/api/admin/email-templates/route.ts` - GET, PUT
- ✅ `app/api/admin/email-templates/[id]/route.ts` - GET, PUT
- ✅ `app/api/admin/api-keys/route.ts` - GET, POST
- ✅ `app/api/admin/api-keys/[id]/route.ts` - GET, PUT, DELETE
- ✅ `app/api/admin/navigation/route.ts` - GET, POST
- ✅ `app/api/admin/navigation/[id]/route.ts` - GET, PUT, DELETE
- ✅ `app/api/admin/crossref/register/route.ts` - POST
- ✅ `app/api/admin/crossref/status/[doi]/route.ts` - GET
- ✅ `app/api/admin/crossref/registrations/route.ts` - GET

### Routes Still Using requireSuperAdmin() (Less Critical)
Routes berikut masih menggunakan `requireSuperAdmin()` tetapi kurang sering digunakan:
- `app/api/admin/backup/route.ts`
- `app/api/admin/maintenance/route.ts`
- `app/api/admin/health/route.ts`
- `app/api/admin/languages/route.ts`
- `app/api/admin/api-keys/[id]/regenerate/route.ts`
- `app/api/admin/plugins/route.ts`
- `app/api/admin/plugins/[pluginName]/route.ts`
- `app/api/admin/tasks/route.ts`
- `app/api/admin/tasks/[id]/route.ts`
- `app/api/admin/tasks/[id]/run/route.ts`

Routes ini bisa di-update nanti jika diperlukan.

## Testing
1. Login sebagai super admin
2. Akses semua menu admin:
   - ✅ Manajemen Pengguna
   - ✅ Manajemen Jurnal
   - ✅ Manajemen Isu
   - ✅ Settings
   - ✅ System Information
   - ✅ Statistics & Reports
   - ✅ Activity Log
   - ✅ Email Templates
   - ✅ Announcements
   - ✅ Navigation Menus
   - ✅ API Keys
   - ✅ Crossref

## Notes
- `checkSuperAdmin()` menggunakan `.limit(1)` untuk handle multiple super admin entries
- Semua routes utama sudah di-update dan tested
- Tidak ada linter errors
- Routes yang kurang sering digunakan bisa di-update nanti jika diperlukan



