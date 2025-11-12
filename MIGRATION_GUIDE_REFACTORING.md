# Migration Guide - Refactoring to OJS PKP 3.3 Structure

## Overview

This guide explains how to migrate the database schema and update the codebase to match the OJS PKP 3.3 structure with proper separation of site-level, journal-level, and workflow-level data.

## Prerequisites

- Supabase project with existing data
- Backup of your database (CRITICAL)
- Access to Supabase SQL Editor
- Environment variables configured:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (new, required for Server Actions)

## Step 1: Database Migration

### 1.1 Backup Database

**IMPORTANT**: Always backup your database before running migrations.

1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Create a manual backup

### 1.2 Run Migration SQL

1. Open Supabase SQL Editor
2. Open the file `supabase/migrations/004_refactor_schema_for_super_admin.sql`
3. Copy the entire SQL script
4. Paste into Supabase SQL Editor
5. Run the migration
6. Verify migration success (check for errors)

### 1.3 Verify Migration

Run these queries to verify the migration:

```sql
-- Check if sites table exists and has data
SELECT * FROM sites;

-- Check if roles table exists and has data
SELECT * FROM roles;

-- Check if permissions table exists and has data
SELECT * FROM permissions;

-- Check if user_role_assignments table exists and has migrated data
SELECT COUNT(*) FROM user_role_assignments;

-- Check if existing tenant_users data was migrated
SELECT 
  tu.user_id,
  tu.role,
  ura.role_id,
  r.role_key
FROM tenant_users tu
LEFT JOIN user_role_assignments ura ON ura.user_id = tu.user_id
LEFT JOIN roles r ON r.role_key = tu.role::text
LIMIT 10;
```

## Step 2: Update Environment Variables

Add the following environment variable to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: 
- Never commit this key to version control
- This key bypasses RLS and should only be used server-side
- Get this key from Supabase Dashboard → Settings → API → Service Role Key

## Step 3: Update Code to Use New Schema

### 3.1 Update `checkSuperAdmin()`

After migration, update `lib/admin/auth.ts` to use the new `user_role_assignments` table:

```typescript
// OLD (using tenant_users)
const { data: tenantUsers } = await supabase
  .from('tenant_users')
  .select('role')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .eq('role', 'super_admin')
  .limit(1)

// NEW (using user_role_assignments)
const { data: roleAssignments } = await supabase
  .from('user_role_assignments')
  .select('role_id, roles!inner(role_key)')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .eq('roles.role_key', 'super_admin')
  .limit(1)
```

### 3.2 Update `get-role.ts`

Update `lib/auth/get-role.ts` to use the new schema:

```typescript
// OLD (using tenant_users)
const { data } = await supabase
  .from('tenant_users')
  .select('role, tenant_id, journal_id:tenant_id, is_active')
  .eq('user_id', userId)
  .eq('is_active', true)

// NEW (using user_role_assignments)
const { data } = await supabase
  .from('user_role_assignments')
  .select('role_id, journal_id, tenant_id, is_active, roles!inner(role_key)')
  .eq('user_id', userId)
  .eq('is_active', true)
```

## Step 4: Test Migration

### 4.1 Test Super Admin Access

1. Login as super admin user
2. Verify access to `/admin/dashboard`
3. Verify access to `/admin/settings`
4. Check browser console for any errors

### 4.2 Test Server Actions

1. Navigate to `/admin/settings`
2. Update a setting
3. Verify the update is saved
4. Check audit logs for the update

### 4.3 Test Role Assignments

1. Navigate to `/admin/users`
2. Assign a role to a user
3. Verify the assignment is saved
4. Check audit logs for the assignment

## Step 5: Rollback Plan (If Needed)

If the migration fails or causes issues, you can rollback:

### 5.1 Restore Database Backup

1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Restore the backup you created in Step 1.1

### 5.2 Revert Code Changes

1. Revert changes to `lib/admin/auth.ts`
2. Revert changes to `lib/auth/get-role.ts`
3. Remove Server Actions that use new schema
4. Restore API routes if needed

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**: The table already exists. Check if you've run the migration before. You may need to drop existing tables first (be careful!).

### Issue: "SUPABASE_SERVICE_ROLE_KEY is not defined"

**Solution**: Add the environment variable to `.env.local` and restart your development server.

### Issue: "Unauthorized" errors after migration

**Solution**: 
1. Verify the migration ran successfully
2. Check if user roles were migrated correctly
3. Verify RLS policies are set correctly
4. Check browser console for detailed error messages

### Issue: Data not migrated from tenant_users

**Solution**: 
1. Check the migration SQL for the INSERT statement
2. Verify tenant_users table has data
3. Manually run the migration INSERT statement if needed

## Post-Migration Checklist

- [ ] Database migration completed successfully
- [ ] Environment variables updated
- [ ] Code updated to use new schema
- [ ] Super admin access working
- [ ] Server Actions working
- [ ] Audit logs working
- [ ] Role assignments working
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] All tests passing (if applicable)

## Next Steps

After successful migration:

1. Update remaining code to use new schema
2. Migrate all API routes to Server Actions
3. Update UI components to use Server Actions
4. Test all functionality thoroughly
5. Update documentation

## Support

If you encounter issues during migration:

1. Check the migration SQL for errors
2. Verify database backup is available
3. Check Supabase logs for detailed error messages
4. Review the troubleshooting section above
5. Contact support if needed



