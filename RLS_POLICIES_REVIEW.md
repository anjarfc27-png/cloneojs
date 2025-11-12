# RLS Policies Review

## Overview
Row Level Security (RLS) policies telah diimplementasikan untuk mengontrol akses data di level database. Semua policies menggunakan helper functions untuk check super admin status.

## Helper Functions

### `user_is_super_admin(user_id UUID)`
Function untuk check apakah user adalah super admin:
- Check di `user_role_assignments` table dengan role `super_admin`
- Backward compatible dengan `tenant_users` table
- Return `true` jika user adalah super admin, `false` otherwise

### `user_has_role(user_id UUID, role_key TEXT, journal_id UUID DEFAULT NULL)`
Function untuk check apakah user memiliki role tertentu:
- Check di `user_role_assignments` table
- Support journal-specific roles
- Return `true` jika user memiliki role, `false` otherwise

## RLS Policies

### 1. Sites Table
**Table**: `sites`
**Policies**:
- `super_admin_full_access_sites`: Super admin dapat read/write semua sites
- `authenticated_read_sites`: Authenticated users dapat read sites

**Access Control**:
- ✅ Super admin: Full access (SELECT, INSERT, UPDATE, DELETE)
- ✅ Authenticated users: Read-only (SELECT)

### 2. Roles Table
**Table**: `roles`
**Policies**:
- `super_admin_full_access_roles`: Super admin dapat read/write semua roles
- `authenticated_read_roles`: Authenticated users dapat read roles

**Access Control**:
- ✅ Super admin: Full access (SELECT, INSERT, UPDATE, DELETE)
- ✅ Authenticated users: Read-only (SELECT)

### 3. Permissions Table
**Table**: `permissions`
**Policies**:
- `super_admin_full_access_permissions`: Super admin dapat read/write semua permissions
- `authenticated_read_permissions`: Authenticated users dapat read permissions

**Access Control**:
- ✅ Super admin: Full access (SELECT, INSERT, UPDATE, DELETE)
- ✅ Authenticated users: Read-only (SELECT)

### 4. Role Permissions Table
**Table**: `role_permissions`
**Policies**:
- `super_admin_full_access_role_permissions`: Super admin dapat read/write semua role permissions
- `authenticated_read_role_permissions`: Authenticated users dapat read role permissions

**Access Control**:
- ✅ Super admin: Full access (SELECT, INSERT, UPDATE, DELETE)
- ✅ Authenticated users: Read-only (SELECT)

### 5. User Role Assignments Table
**Table**: `user_role_assignments`
**Policies**:
- `super_admin_full_access_user_roles`: Super admin dapat read/write semua user role assignments
- `users_read_own_roles`: Users dapat read own role assignments

**Access Control**:
- ✅ Super admin: Full access (SELECT, INSERT, UPDATE, DELETE)
- ✅ Authenticated users: Read own roles only (SELECT where user_id = auth.uid())

### 6. Activity Logs Table
**Table**: `activity_logs`
**Policies**:
- `super_admin_read_activity_logs`: Super admin dapat read activity logs
- `super_admin_write_activity_logs`: Super admin dapat write activity logs

**Access Control**:
- ✅ Super admin: Full access (SELECT, INSERT)
- ❌ Other users: No access

**Notes**:
- Activity logs hanya bisa diakses oleh super admin
- Policies menggunakan conditional creation (`DO $$ BEGIN ... END $$;`) untuk handle cases where table might not exist

## Security Considerations

### 1. Super Admin Access
- Super admin memiliki full access ke semua tables
- Super admin status di-check menggunakan `user_is_super_admin()` function
- Function ini backward compatible dengan `tenant_users` table

### 2. User Access
- Regular users hanya bisa read certain tables (sites, roles, permissions, role_permissions)
- Users hanya bisa read their own role assignments
- Users tidak bisa access activity logs

### 3. Backward Compatibility
- Policies menggunakan backward compatible approach
- Check `user_role_assignments` first, fallback ke `tenant_users` if needed
- This ensures smooth migration from old schema to new schema

### 4. Performance
- Policies menggunakan indexes untuk performance
- Helper functions are optimized for quick lookups
- Policies are evaluated at query time

## Testing RLS Policies

### Test Super Admin Access
```sql
-- Test super admin can read sites
SELECT * FROM sites WHERE user_is_super_admin(auth.uid());

-- Test super admin can write sites
INSERT INTO sites (name, description) VALUES ('Test', 'Test Description');
```

### Test User Access
```sql
-- Test user can read sites
SELECT * FROM sites;

-- Test user cannot write sites
INSERT INTO sites (name, description) VALUES ('Test', 'Test Description');
-- Should fail with RLS policy violation
```

### Test Activity Logs Access
```sql
-- Test super admin can read activity logs
SELECT * FROM activity_logs WHERE user_is_super_admin(auth.uid());

-- Test user cannot read activity logs
SELECT * FROM activity_logs;
-- Should return empty or fail with RLS policy violation
```

## Future Improvements

### 1. Journal-Specific Policies
- Implement policies for journal-specific data
- Support multi-tenant architecture
- Allow journal admins to manage their journals

### 2. Workflow-Level Policies
- Implement policies for workflow-level data
- Support editorial workflow
- Allow editors to manage their workflows

### 3. Fine-Grained Permissions
- Implement fine-grained permissions using `permissions` table
- Support custom permissions per role
- Allow dynamic permission checking

### 4. Audit Logging
- Log all RLS policy violations
- Monitor access patterns
- Detect suspicious activities

### 5. Performance Optimization
- Add indexes for frequently queried columns
- Optimize helper functions
- Cache super admin status

## Migration Notes

### From Old Schema to New Schema
1. **Backward Compatibility**: Policies support both `user_role_assignments` and `tenant_users` tables
2. **Migration Path**: Data migration from `tenant_users` to `user_role_assignments` is handled in migration script
3. **Testing**: Test all policies after migration to ensure they work correctly

### Policy Updates
1. **Adding New Policies**: Add new policies using `CREATE POLICY` statement
2. **Updating Policies**: Update policies using `DROP POLICY` and `CREATE POLICY` statements
3. **Removing Policies**: Remove policies using `DROP POLICY` statement

## Best Practices

### 1. Always Use Helper Functions
- Use `user_is_super_admin()` for super admin checks
- Use `user_has_role()` for role checks
- Don't duplicate logic in policies

### 2. Test Policies Thoroughly
- Test with super admin user
- Test with regular user
- Test with unauthenticated user
- Test edge cases

### 3. Document Policies
- Document all policies
- Explain access control rules
- Provide examples

### 4. Monitor Policy Performance
- Monitor query performance
- Check for policy violations
- Optimize slow queries

### 5. Keep Policies Simple
- Avoid complex logic in policies
- Use helper functions for complex checks
- Keep policies readable and maintainable

---

**Last Updated**: RLS Policies Review Completed
**Status**: ✅ Policies Implemented and Documented

