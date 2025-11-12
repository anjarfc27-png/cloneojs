# API Routes Deprecated

## Overview
Semua admin API routes telah digantikan oleh Server Actions untuk performa dan keamanan yang lebih baik.

## Migration Status

### ✅ Migrated to Server Actions
Semua routes berikut telah dimigrasi ke Server Actions dan dapat dihapus:

1. **Settings** - `app/api/admin/settings/route.ts`
   - Replaced by: `actions/site-settings/get.ts`, `actions/site-settings/update.ts`

2. **Journals** - `app/api/admin/journals/route.ts`, `app/api/admin/journals/[id]/route.ts`
   - Replaced by: `actions/journals/get.ts`, `actions/journals/create.ts`, `actions/journals/update.ts`, `actions/journals/delete.ts`

3. **Users** - `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`
   - Replaced by: `actions/users/get.ts`, `actions/users/create.ts`, `actions/users/update.ts`, `actions/users/delete.ts`, `actions/users/roles.ts`

4. **Announcements** - `app/api/admin/announcements/route.ts`, `app/api/admin/announcements/[id]/route.ts`
   - Replaced by: `actions/announcements/get.ts`, `actions/announcements/create.ts`, `actions/announcements/update.ts`, `actions/announcements/delete.ts`

5. **Navigation** - `app/api/admin/navigation/route.ts`, `app/api/admin/navigation/[id]/route.ts`
   - Replaced by: `actions/navigation/get.ts`, `actions/navigation/create.ts`, `actions/navigation/update.ts`, `actions/navigation/delete.ts`, `actions/navigation/reorder.ts`

6. **Languages** - `app/api/admin/languages/route.ts`
   - Replaced by: `actions/languages/get.ts`, `actions/languages/update.ts`

7. **Activity Logs** - `app/api/admin/activity-logs/route.ts`
   - Replaced by: `actions/activity-logs/get.ts`, `actions/activity-logs/cleanup.ts`

8. **Email Templates** - `app/api/admin/email-templates/route.ts`, `app/api/admin/email-templates/[id]/route.ts`
   - Replaced by: `actions/email-templates/get.ts`, `actions/email-templates/update.ts`

9. **Issues** - `app/api/admin/issues/route.ts`, `app/api/admin/issues/[id]/route.ts`, `app/api/admin/issues/[id]/publish/route.ts`
   - Replaced by: `actions/issues/get.ts`, `actions/issues/create.ts`, `actions/issues/update.ts`, `actions/issues/delete.ts`, `actions/issues/publish.ts`

10. **System Info** - `app/api/admin/system/information/route.ts`
    - Replaced by: `actions/system-info/get.ts`

11. **Statistics** - `app/api/admin/statistics/route.ts`
    - Replaced by: `actions/statistics/get.ts`

12. **Health** - `app/api/admin/health/route.ts`
    - Replaced by: `actions/health/get.ts`

13. **API Keys** - `app/api/admin/api-keys/route.ts`, `app/api/admin/api-keys/[id]/route.ts`, `app/api/admin/api-keys/[id]/regenerate/route.ts`
    - Replaced by: `actions/api-keys/get.ts`, `actions/api-keys/create.ts`, `actions/api-keys/update.ts`, `actions/api-keys/delete.ts`, `actions/api-keys/regenerate.ts`

14. **Tasks** - `app/api/admin/tasks/route.ts`, `app/api/admin/tasks/[id]/route.ts`, `app/api/admin/tasks/[id]/run/route.ts`
    - Replaced by: `actions/tasks/get.ts`, `actions/tasks/create.ts`, `actions/tasks/update.ts`, `actions/tasks/run.ts`

15. **Plugins** - `app/api/admin/plugins/route.ts`, `app/api/admin/plugins/[pluginName]/route.ts`
    - Replaced by: `actions/plugins/get.ts`, `actions/plugins/update.ts`, `actions/plugins/delete.ts`

16. **Backup** - `app/api/admin/backup/route.ts`
    - Replaced by: `actions/backup/get.ts`, `actions/backup/create.ts`, `actions/backup/delete.ts`

17. **Maintenance** - `app/api/admin/maintenance/route.ts`
    - Replaced by: `actions/maintenance/get.ts`, `actions/maintenance/run.ts`

18. **Crossref** - `app/api/admin/crossref/register/route.ts`, `app/api/admin/crossref/registrations/route.ts`, `app/api/admin/crossref/status/[doi]/route.ts`
    - Replaced by: `actions/crossref/get.ts`, `actions/crossref/register.ts`

## Safe to Delete

Semua routes di atas dapat dihapus dengan aman karena:
1. ✅ Semua admin pages sudah menggunakan Server Actions
2. ✅ Tidak ada references ke API routes di codebase
3. ✅ Komponen (UserFormModal, JournalFormModal) sudah di-update untuk menggunakan Server Actions
4. ✅ Tidak ada external services yang menggunakan API routes ini

## Notes

- Route group `(super-admin)` sudah dibuat
- Semua pages sudah dipindahkan ke route group
- Layout sudah di-update untuk menggunakan `requireSuperAdmin()`
- Navigation links tidak perlu di-update (URLs tetap sama)

## Backup

Sebelum menghapus, pastikan:
1. ✅ Semua pages sudah menggunakan Server Actions
2. ✅ Tidak ada references ke API routes
3. ✅ Test semua functionality
4. ✅ Backup code jika diperlukan

---

**Last Updated**: Route Group Migration Completed
**Status**: Ready for API routes deletion

