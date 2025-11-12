# Troubleshooting Guide - Perubahan Tidak Terlihat

## 🔍 Problem: "Kok belum ada perubahan ya"

Jika perubahan tidak terlihat setelah refactoring, ikuti langkah-langkah berikut:

## ✅ Step 1: Verifikasi Build Error Sudah Fixed

### Check Folder Structure
```bash
# Pastikan folder lama sudah dihapus
Test-Path "app\admin"  # Should return False

# Pastikan route group ada
Test-Path "app\(super-admin)\admin"  # Should return True
```

### Expected Result
- ✅ Folder `app/admin/` **tidak ada** (sudah dihapus)
- ✅ Route group `(super-admin)/admin/` **ada**
- ✅ Tidak ada duplicate routes

## ✅ Step 2: Restart Development Server

### Why?
- Next.js perlu detect route changes
- Cache perlu di-clear
- Server Actions perlu di-reload

### How?
1. **Stop development server** (Ctrl+C)
2. **Clear Next.js cache**:
   ```bash
   Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
   ```
3. **Restart development server**:
   ```bash
   npm run dev
   ```

## ✅ Step 3: Clear Browser Cache

### Why?
- Browser mungkin cache old JavaScript
- Old API routes mungkin masih di-cache
- Service workers mungkin cache old files

### How?
1. **Hard Refresh**:
   - Windows/Linux: `Ctrl + Shift + R` atau `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Clear Browser Cache**:
   - Open DevTools (F12)
   - Right-click on refresh button
   - Select "Empty Cache and Hard Reload"

3. **Clear Application Cache**:
   - Open DevTools (F12)
   - Go to Application tab
   - Click "Clear storage"
   - Check "Cached images and files"
   - Click "Clear site data"

## ✅ Step 4: Verify Server Actions Are Working

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors
4. Check Network tab - **should NOT see calls to `/api/admin/*`**

### Check Server Console
1. Check terminal where `npm run dev` is running
2. Look for Server Actions logs
3. Check for errors
4. Verify Server Actions are being called

### Test Server Actions Directly
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try calling Server Action:
   ```javascript
   // This won't work directly, but you can check Network tab
   // to see if Server Actions are being called
   ```

## ✅ Step 5: Verify Authentication

### Check User Role
1. Login as super admin
2. Check browser console for authentication logs
3. Verify `requireSuperAdmin()` is working
4. Check database for user role:
   ```sql
   -- Check user_role_assignments
   SELECT * FROM user_role_assignments WHERE user_id = 'YOUR_USER_ID';
   
   -- Or check tenant_users (backward compatibility)
   SELECT * FROM tenant_users WHERE user_id = 'YOUR_USER_ID' AND role = 'super_admin';
   ```

### Check Authorization
1. Verify `checkSuperAdmin()` returns `authorized: true`
2. Check Server Actions logs for authorization errors
3. Verify RLS policies are not blocking access

## ✅ Step 6: Verify Database Connection

### Check Database
1. Verify Supabase connection is working
2. Check if `site_settings` table exists
3. Check if data exists in tables
4. Verify RLS policies are correct

### Test Database Query
```sql
-- Check site_settings table
SELECT * FROM site_settings LIMIT 10;

-- Check user_role_assignments
SELECT * FROM user_role_assignments LIMIT 10;

-- Check activity_logs
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
```

## ✅ Step 7: Check for TypeScript Errors

### Check TypeScript
```bash
# Check for TypeScript errors
npx tsc --noEmit
```

### Check Linter
```bash
# Check for linter errors
npm run lint
```

## ✅ Step 8: Verify Changes in Code

### Check Settings Page
1. Open `app/(super-admin)/admin/settings/page.tsx`
2. Verify it uses `getSiteSettings()` from `@/actions/site-settings/get`
3. Verify it uses `updateSiteSettingsBulk()` from `@/actions/site-settings/update`
4. Verify **NO** calls to `/api/admin/settings`

### Check Other Pages
1. Verify all pages use Server Actions
2. Verify **NO** API route calls
3. Verify imports are correct

## 🔧 Common Issues & Solutions

### Issue 1: Page Not Loading
**Symptoms**:
- Page shows loading forever
- Page shows error
- Page redirects to login

**Solutions**:
1. Check browser console for errors
2. Check server console for errors
3. Verify authentication is working
4. Verify Server Actions are working
5. Check database connection
6. Verify RLS policies

### Issue 2: Data Not Loading
**Symptoms**:
- Page loads but no data
- Empty tables/lists
- Error messages

**Solutions**:
1. Check Server Actions are returning data
2. Check database has data
3. Verify RLS policies allow access
4. Check Server Actions logs
5. Verify `checkSuperAdmin()` is working

### Issue 3: Forms Not Saving
**Symptoms**:
- Save button doesn't work
- Error when saving
- Data not persisted

**Solutions**:
1. Check Server Actions are being called
2. Check validation errors
3. Verify database connection
4. Check RLS policies allow writes
5. Verify audit logging is working

### Issue 4: Unauthorized Errors
**Symptoms**:
- "Unauthorized" errors
- Redirects to login
- Access denied

**Solutions**:
1. Verify user is super admin
2. Check `user_role_assignments` table
3. Check `tenant_users` table (backward compatibility)
4. Verify `requireSuperAdmin()` is working
5. Check Server Actions authorization

### Issue 5: Build Errors
**Symptoms**:
- Build fails
- Compilation errors
- Type errors

**Solutions**:
1. Check for TypeScript errors
2. Check for import errors
3. Verify all files exist
4. Check for duplicate routes
5. Verify route group structure

## 🚀 Quick Fix Checklist

### Before Testing
- [ ] Folder `app/admin/` sudah dihapus
- [ ] Route group `(super-admin)/admin/` ada
- [ ] All pages use Server Actions
- [ ] No API route calls
- [ ] TypeScript compiles without errors
- [ ] No linter errors

### After Restart
- [ ] Clear `.next` cache
- [ ] Restart development server
- [ ] Clear browser cache
- [ ] Hard refresh browser
- [ ] Check browser console for errors
- [ ] Check server console for errors

### After Login
- [ ] Login as super admin
- [ ] Verify redirect to `/admin/dashboard`
- [ ] Check browser console for auth logs
- [ ] Verify `requireSuperAdmin()` works
- [ ] Check Server Actions are called

### After Accessing Pages
- [ ] Pages load without errors
- [ ] Data loads correctly
- [ ] Forms work correctly
- [ ] Server Actions execute
- [ ] No API route calls in Network tab
- [ ] Changes persist in database

## 📝 Debugging Steps

### 1. Check Browser Console
```javascript
// Open DevTools (F12)
// Go to Console tab
// Look for errors
// Check Network tab for API calls
```

### 2. Check Server Console
```bash
# Check terminal where npm run dev is running
# Look for Server Actions logs
# Check for errors
# Verify Server Actions are being called
```

### 3. Check Database
```sql
-- Check if data exists
SELECT * FROM site_settings;
SELECT * FROM user_role_assignments;
SELECT * FROM activity_logs;
```

### 4. Check Server Actions
```typescript
// Verify Server Actions are exported correctly
// Check if they're being called
// Verify they return correct data
```

## 🎯 Expected Behavior After Fix

### Settings Page
- ✅ Page loads dengan settings data
- ✅ Tabs work correctly
- ✅ Form fields populated
- ✅ Save button works
- ✅ Success/error messages display
- ✅ Data persists in database

### All Pages
- ✅ Pages load dengan data
- ✅ Forms work correctly
- ✅ Server Actions execute
- ✅ No API route calls
- ✅ Error handling works
- ✅ Loading states work

## 📞 Still Having Issues?

If you're still having issues after following all steps:

1. **Check Error Messages**: Look for specific error messages in browser/server console
2. **Check Logs**: Review Server Actions logs for detailed error information
3. **Check Database**: Verify data exists and RLS policies are correct
4. **Check Authentication**: Verify user is super admin and authorization is working
5. **Check Network**: Verify no API route calls are being made

---

**Last Updated**: Troubleshooting Guide
**Status**: ✅ **Ready to Use**

