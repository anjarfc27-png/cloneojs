# Rencana Penyelesaian Master Prompt - Step by Step

## 📋 PRIORITY 1: Complete Foundation (FASE 1) - EST. 2-3 jam

### 1.1 Implement Security Utilities (EST. 1 jam)
- [ ] Implement `lib/security/sanitize-html.ts` (DOMpurify atau sanitize-html)
- [ ] Implement `lib/security/validate-mime.ts` (mime type validation)
- [ ] Implement `lib/security/file-hash.ts` (SHA-256 hashing)
- [ ] Test semua security utilities

### 1.2 Implement Audit Logging (EST. 30 menit)
- [ ] Implement `lib/audit/log.ts` (full implementation)
- [ ] Test audit logging
- [ ] Verify audit logs di database

### 1.3 Complete UI Components (EST. 1 jam)
- [ ] Implement `components/data-table/DataTable.tsx` (full dengan pagination, sorting, filtering)
- [ ] Implement `components/drawer/Drawer.tsx` (slide-over panel)
- [ ] Implement `components/modal-confirm/ModalConfirm.tsx` (confirmation modal)
- [ ] Implement `components/badge/StatusBadge.tsx` (status badge dengan colors)
- [ ] Test semua UI components

---

## 📋 PRIORITY 2: Migrate Core Modules (FASE 2.2-2.3) - EST. 4-6 jam

### 2.1 Hosted Journals Module (EST. 2-3 jam)
- [ ] Create `actions/journals/get.ts` (get journals, get journal by id)
- [ ] Create `actions/journals/create.ts` (create journal)
- [ ] Create `actions/journals/update.ts` (update journal)
- [ ] Create `actions/journals/delete.ts` (delete journal)
- [ ] Update `app/admin/journals/page.tsx` to use Server Actions
- [ ] Test journal CRUD operations
- [ ] Verify audit logging

### 2.2 Users & Roles Module (EST. 2-3 jam)
- [ ] Create `actions/users/get.ts` (get users, get user by id)
- [ ] Create `actions/users/create.ts` (create user)
- [ ] Create `actions/users/update.ts` (update user)
- [ ] Create `actions/users/delete.ts` (delete user)
- [ ] Create `actions/roles/get.ts` (get roles, get role by id)
- [ ] Create `actions/roles/assign.ts` (assign role to user)
- [ ] Create `actions/roles/revoke.ts` (revoke role from user)
- [ ] Update `app/admin/users/page.tsx` to use Server Actions
- [ ] Test user CRUD operations
- [ ] Test role assignment
- [ ] Verify audit logging

---

## 📋 PRIORITY 3: Migrate Remaining Modules (FASE 2.4) - EST. 8-12 jam

### 3.1 Announcements Module (EST. 1 jam)
- [ ] Create `actions/announcements/*`
- [ ] Update `app/admin/announcements/page.tsx`

### 3.2 Navigation Module (EST. 1 jam)
- [ ] Create `actions/navigation/*`
- [ ] Update `app/admin/navigation/page.tsx`

### 3.3 Languages Module (EST. 1 jam)
- [ ] Create `actions/languages/*`
- [ ] Update `app/admin/languages/page.tsx`

### 3.4 Plugins Module (EST. 1 jam)
- [ ] Create `actions/plugins/*`
- [ ] Update `app/admin/plugins/page.tsx`

### 3.5 Statistics Module (EST. 1 jam)
- [ ] Create `actions/statistics/*`
- [ ] Update `app/admin/statistics/page.tsx`

### 3.6 Activity Logs Module (EST. 1 jam)
- [ ] Create `actions/activity-logs/*`
- [ ] Update `app/admin/activity-log/page.tsx`

### 3.7 System Info Module (EST. 1 jam)
- [ ] Create `actions/system/*`
- [ ] Update `app/admin/system/information/page.tsx`

### 3.8 Schedulers Module (EST. 1 jam)
- [ ] Create `actions/tasks/*`
- [ ] Update `app/admin/tasks/page.tsx`

### 3.9 Email Templates Module (EST. 1 jam)
- [ ] Create `actions/email-templates/*`
- [ ] Update `app/admin/email-templates/page.tsx`

### 3.10 API Keys Module (EST. 1 jam)
- [ ] Create `actions/api-keys/*`
- [ ] Update `app/admin/api-keys/page.tsx`

### 3.11 Issues Module (EST. 1 jam)
- [ ] Create `actions/issues/*`
- [ ] Update `app/admin/issues/page.tsx`

### 3.12 Crossref Module (EST. 1 jam)
- [ ] Create `actions/crossref/*`
- [ ] Update `app/admin/crossref/page.tsx`

### 3.13 Backup Module (EST. 1 jam)
- [ ] Create `actions/backup/*`
- [ ] Update `app/admin/backup/page.tsx`

### 3.14 Health Module (EST. 30 menit)
- [ ] Create `actions/health/*`
- [ ] Update `app/admin/health/page.tsx`

### 3.15 Maintenance Module (EST. 30 menit)
- [ ] Create `actions/maintenance/*`
- [ ] Update `app/admin/maintenance/page.tsx`

---

## 📋 PRIORITY 4: Route Group Migration (FASE 3) - EST. 2-3 jam

### 4.1 Create Route Group (EST. 1 jam)
- [ ] Create `app/(super-admin)/` folder
- [ ] Create `app/(super-admin)/layout.tsx`
- [ ] Move all admin pages to route group
- [ ] Update imports

### 4.2 Update Layouts (EST. 1 jam)
- [ ] Update `app/(super-admin)/layout.tsx` dengan AdminLayoutWrapper
- [ ] Update navigation links
- [ ] Update routing logic
- [ ] Test semua routes

### 4.3 Update Navigation (EST. 30 menit)
- [ ] Update AdminSidebar dengan route group paths
- [ ] Update semua navigation links
- [ ] Test navigation

---

## 📋 PRIORITY 5: Security & Hardening (FASE 4) - EST. 2-3 jam

### 5.1 CSP Headers (EST. 1 jam)
- [ ] Implement CSP headers di middleware
- [ ] Test CSP headers
- [ ] Verify tidak ada CSP violations

### 5.2 File Scanning Integration (EST. 1 jam)
- [ ] Create Supabase Edge Function untuk file scanning
- [ ] Integrate dengan file upload
- [ ] Test file scanning

### 5.3 Update RLS Policies (EST. 30 menit)
- [ ] Review semua RLS policies
- [ ] Update policies untuk new schema
- [ ] Test RLS policies

### 5.4 Security Testing (EST. 30 menit)
- [ ] Test XSS protection
- [ ] Test SQL injection protection
- [ ] Test CSRF protection
- [ ] Test authorization checks

---

## 📋 PRIORITY 6: Cleanup & Optimization (FASE 5) - EST. 2-3 jam

### 6.1 Remove Unused API Routes (EST. 1 jam)
- [ ] Identify unused API routes
- [ ] Remove unused API routes
- [ ] Update documentation

### 6.2 Remove Duplicate Components (EST. 30 menit)
- [ ] Identify duplicate components
- [ ] Remove duplicates
- [ ] Update imports

### 6.3 Normalize Imports (EST. 30 menit)
- [ ] Fix import paths
- [ ] Remove unused imports
- [ ] Organize imports

### 6.4 Fix Naming Inconsistencies (EST. 30 menit)
- [ ] Fix naming conventions
- [ ] Update variable names
- [ ] Update function names

### 6.5 Optimize Queries (EST. 30 menit)
- [ ] Review database queries
- [ ] Add indexes if needed
- [ ] Optimize slow queries

### 6.6 Update Documentation (EST. 30 menit)
- [ ] Update README
- [ ] Update API documentation
- [ ] Update code comments

---

## 📊 TOTAL ESTIMASI WAKTU

- **Priority 1**: 2-3 jam
- **Priority 2**: 4-6 jam
- **Priority 3**: 8-12 jam
- **Priority 4**: 2-3 jam
- **Priority 5**: 2-3 jam
- **Priority 6**: 2-3 jam

**TOTAL**: 20-30 jam kerja

---

## 🎯 REKOMENDASI

### Opsi 1: Implementasi Bertahap (Recommended)
1. Selesaikan Priority 1 (Foundation) dulu
2. Selesaikan Priority 2 (Core Modules) dulu
3. Selesaikan Priority 3 (Remaining Modules) bertahap
4. Selesaikan Priority 4, 5, 6 setelah semua modules selesai

### Opsi 2: Implementasi Lengkap Sekaligus
- Implement semua priorities sekaligus
- Lebih cepat, tapi lebih banyak perubahan
- Risiko lebih tinggi

### Opsi 3: Fokus Modul Tertentu
- Pilih modul yang paling penting
- Implement modul tersebut lengkap
- Lalu lanjut ke modul berikutnya

---

## ✅ NEXT STEPS

**Pilih salah satu opsi di atas, kemudian saya akan mulai implementasi sesuai rencana.**

Saran: **Opsi 1 (Implementasi Bertahap)** karena lebih aman dan mudah di-test.

---

**Last Updated**: Rencana penyelesaian master prompt
**Status**: Menunggu konfirmasi user untuk melanjutkan


