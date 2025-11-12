# Fix Unauthorized Error - Backup Page

## 🔍 Problem
Pesan "Unauthorized" muncul di halaman Backup & Restore karena:
1. Server Action `getBackups()` melakukan `checkSuperAdmin()`
2. Jika user tidak authorized, return `{ success: false, error: 'Unauthorized' }`
3. Halaman menampilkan error ini sebagai `<ErrorAlert message={error} />`

## ✅ Solution Applied

### 1. Improved Error Message
Updated `app/(super-admin)/admin/backup/page.tsx` to show more helpful error message:
```typescript
if (!result.success) {
  // If unauthorized, show more helpful message
  if (result.error === 'Unauthorized') {
    setError('You do not have permission to access this page. Please contact your administrator.')
  } else {
    setError(result.error || 'Failed to fetch backup information')
  }
  return
}
```

## 🔧 Root Cause

### Possible Causes:
1. **User tidak memiliki super admin role**
   - Check `user_role_assignments` table
   - Check `tenant_users` table (backward compatibility)

2. **Tabel roles/user_role_assignments belum ada**
   - Migration `004_refactor_schema_for_super_admin.sql` belum dijalankan
   - Tabel belum dibuat

3. **User belum di-assign sebagai super admin**
   - Perlu insert ke `user_role_assignments` atau `tenant_users`

## 🚀 How to Fix

### Step 1: Verify Migration
```sql
-- Check if tables exist
SELECT * FROM roles WHERE role_key = 'super_admin';
SELECT * FROM user_role_assignments;
SELECT * FROM tenant_users WHERE role = 'super_admin';
```

### Step 2: Assign Super Admin Role
```sql
-- Option 1: Using new structure (user_role_assignments)
-- First, get super_admin role ID
SELECT id FROM roles WHERE role_key = 'super_admin';

-- Then assign to user (replace USER_ID and ROLE_ID)
INSERT INTO user_role_assignments (user_id, role_id, is_active, assigned_at)
VALUES ('USER_ID', 'ROLE_ID', true, NOW());

-- Option 2: Using old structure (tenant_users) - backward compatibility
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
VALUES ('USER_ID', 'SYSTEM_TENANT_ID', 'super_admin', true);
```

### Step 3: Verify Authorization
```sql
-- Check if user is super admin
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN ura.id IS NOT NULL THEN 'Yes (via user_role_assignments)'
    WHEN tu.id IS NOT NULL THEN 'Yes (via tenant_users)'
    ELSE 'No'
  END as is_super_admin
FROM auth.users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id AND r.role_key = 'super_admin' AND ura.is_active = true
LEFT JOIN tenant_users tu ON u.id = tu.user_id AND tu.role = 'super_admin' AND tu.is_active = true
WHERE u.email = 'YOUR_EMAIL@example.com';
```

## 📝 Verification Checklist

### Code Changes ✅
- [x] Improved error message in backup page
- [x] More helpful message for unauthorized users

### Database Setup ⚠️
- [ ] Migration `004_refactor_schema_for_super_admin.sql` executed
- [ ] Tables `roles`, `user_role_assignments` exist
- [ ] Super admin role exists in `roles` table
- [ ] User assigned as super admin

### Testing ⚠️
- [ ] User can access backup page
- [ ] No "Unauthorized" error
- [ ] Backup data loads correctly

## 🎯 Expected Behavior

### Before Fix
- ❌ Shows "Unauthorized" error
- ❌ No helpful message
- ❌ User doesn't know what to do

### After Fix
- ✅ Shows helpful error message
- ✅ Explains what's wrong
- ✅ Suggests contacting administrator

## 📞 Next Steps

1. **Check Database**: Verify user has super admin role
2. **Run Migration**: If tables don't exist, run migration
3. **Assign Role**: Assign super admin role to user
4. **Test**: Verify page works correctly

---

**Last Updated**: Fix Unauthorized Error
**Status**: ✅ **Error Message Improved - Need to Fix Authorization**

