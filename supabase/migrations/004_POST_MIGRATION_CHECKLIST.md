# Post-Migration Checklist - Migration 004

## ✅ Migration Status: SUCCESSFUL

Berdasarkan hasil query `SELECT COUNT(*) FROM user_role_assignments;` yang menunjukkan **2 rows**, migration telah berhasil dijalankan.

## Verification Steps

### 1. ✅ Basic Tables Created
- [x] `sites` table exists
- [x] `roles` table exists
- [x] `permissions` table exists
- [x] `role_permissions` table exists
- [x] `user_role_assignments` table exists (2 rows migrated)
- [x] `activity_logs` table exists

### 2. Run Verification Queries

Jalankan file `004_VERIFICATION_QUERIES.sql` untuk verifikasi lengkap:

```sql
-- Check all tables and structures
-- Verify RLS policies
-- Verify indexes
-- Verify triggers
-- Verify functions
```

### 3. Important Checks

#### Check Default Site Created
```sql
SELECT * FROM sites WHERE slug = 'default';
```
**Expected**: 1 row with name 'OJS Platform'

#### Check Default Roles Created
```sql
SELECT role_key, name FROM roles ORDER BY role_key;
```
**Expected**: 12 roles including 'super_admin', 'site_admin', 'journal_manager', etc.

#### Check Super Admin Role Permissions
```sql
SELECT COUNT(*) 
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.role_key = 'super_admin';
```
**Expected**: 11 permissions (all permissions assigned to super_admin)

#### Check User Role Assignments Migrated
```sql
SELECT 
    ura.user_id,
    r.role_key,
    ura.is_active
FROM user_role_assignments ura
JOIN roles r ON r.id = ura.role_id;
```
**Expected**: Your existing user roles migrated from `tenant_users`

#### Check Activity Logs Structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs'
ORDER BY ordinal_position;
```
**Expected**: Columns including `id`, `user_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `user_agent`, `created_at`

### 4. Test Helper Functions

#### Test user_is_super_admin function
```sql
-- Replace 'your-user-id' with actual user ID
SELECT user_is_super_admin('your-user-id'::uuid);
```
**Expected**: `true` for super admin users, `false` for others

#### Test user_has_role function
```sql
-- Replace 'your-user-id' and 'role-key' with actual values
SELECT user_has_role('your-user-id'::uuid, 'super_admin');
```
**Expected**: `true` if user has the role, `false` otherwise

### 5. Verify RLS Policies

#### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sites', 'roles', 'permissions', 'user_role_assignments', 'activity_logs');
```
**Expected**: All tables should have `rowsecurity = true`

#### Check RLS Policies Exist
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('sites', 'roles', 'permissions', 'user_role_assignments', 'activity_logs');
```
**Expected**: Multiple policies for each table

### 6. Verify Journals Table Updates

#### Check Journals have site_id
```sql
SELECT 
    j.id,
    j.title,
    j.site_id,
    s.name as site_name
FROM journals j
LEFT JOIN sites s ON s.id = j.site_id;
```
**Expected**: All journals should have `site_id` set to default site

#### Check Journals have path and status
```sql
SELECT id, title, path, status FROM journals LIMIT 5;
```
**Expected**: `path` and `status` columns exist (can be NULL for existing journals)

## Next Steps

### 1. Update Environment Variables

Tambahkan ke `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Test Server Actions

1. Navigate to `/admin/settings`
2. Try updating a setting
3. Check if audit log is created:
```sql
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;
```

### 3. Verify Super Admin Access

1. Login as super admin user
2. Verify access to `/admin/dashboard`
3. Verify access to `/admin/settings`
4. Verify access to `/admin/users`

### 4. Test Role Assignments

1. Navigate to `/admin/users`
2. Try assigning a role to a user
3. Verify in database:
```sql
SELECT 
    ura.user_id,
    r.role_key,
    ura.journal_id,
    ura.is_active
FROM user_role_assignments ura
JOIN roles r ON r.id = ura.role_id
WHERE ura.user_id = 'your-user-id';
```

## Common Issues & Solutions

### Issue: RLS Policies Blocking Access

**Solution**: Check if user is super admin:
```sql
SELECT user_is_super_admin('your-user-id'::uuid);
```

If false, assign super_admin role:
```sql
INSERT INTO user_role_assignments (user_id, role_id, is_active)
SELECT 
    'your-user-id'::uuid,
    r.id,
    true
FROM roles r
WHERE r.role_key = 'super_admin'
ON CONFLICT DO NOTHING;
```

### Issue: Activity Logs Not Working

**Solution**: Check if RLS policies allow insertion:
```sql
SELECT * FROM pg_policies WHERE tablename = 'activity_logs';
```

### Issue: Journals Missing site_id

**Solution**: Update journals manually:
```sql
UPDATE journals
SET site_id = (SELECT id FROM sites WHERE slug = 'default' LIMIT 1)
WHERE site_id IS NULL;
```

## Success Criteria

- [x] All tables created successfully
- [x] User role assignments migrated (2 rows)
- [ ] All verification queries pass
- [ ] RLS policies working correctly
- [ ] Helper functions working correctly
- [ ] Server Actions working correctly
- [ ] Audit logging working correctly
- [ ] Super admin access working correctly

## Support

If you encounter any issues:
1. Check the verification queries results
2. Review the error messages
3. Check RLS policies
4. Verify user roles are assigned correctly
5. Check audit logs for errors



