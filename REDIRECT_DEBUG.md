# Debug: Super Admin Redirect Issue

## Problem
After successful login, user is redirected to `/admin/dashboard`, but then gets redirected back to `/login`.

## Logs Analysis
```
[LOGIN] ✅ Login successful! User: anjarbdn@gmail.com
[LOGIN] ✅ Session verified, checking user role...
[LOGIN] ✅ User is super admin, redirecting to /admin/dashboard
Navigated to http://localhost:3000/login
```

## Root Cause
The issue is likely a **cookie synchronization problem**:
1. Client-side login succeeds and sets cookie
2. Client redirects to `/admin/dashboard` using `window.location.href`
3. Server-side `AdminLayout` runs and calls `requireSuperAdmin()`
4. `requireSuperAdmin()` tries to read cookie using `cookies()` from `next/headers`
5. Cookie might not be immediately available on server side
6. `requireSuperAdmin()` doesn't find user, redirects to `/login`

## Solutions Implemented

### 1. Enhanced Logging in `requireSuperAdmin()`
Added detailed logging to see exactly what's happening:
- Log when checking authentication
- Log user found/not found
- Log super admin role check results
- Log all errors with details

### 2. Improved Cookie Sync in `LoginForm`
- Changed from `window.location.href` to `router.push()` for better Next.js navigation
- Added `router.refresh()` to force server-side re-render
- Increased delay from 100ms to 200ms before redirect

### 3. Middleware Enhancement
- Added super admin check in middleware
- Redirect logged-in users from `/login` to appropriate dashboard based on role

## Testing Steps

1. **Clear browser cache and cookies**
2. **Login with anjarbdn@gmail.com**
3. **Check browser console logs:**
   - Should see `[LOGIN] ✅ User is super admin`
   - Should see redirect to `/admin/dashboard`
4. **Check server console logs:**
   - Should see `[requireSuperAdmin] User found: anjarbdn@gmail.com`
   - Should see `[requireSuperAdmin] ✅ User is super admin, allowing access`
5. **If still redirecting to `/login`:**
   - Check server logs for `[requireSuperAdmin]` errors
   - Verify cookie is being set correctly
   - Check RLS policies in Supabase

## Expected Behavior

### Success Flow:
1. User logs in → Cookie set in browser
2. Client checks role → Super admin detected
3. Client redirects to `/admin/dashboard` using `router.push()`
4. Server receives request → Cookie available
5. `requireSuperAdmin()` finds user → Super admin verified
6. Admin dashboard loads successfully

### Failure Flow (if cookie not synced):
1. User logs in → Cookie set in browser
2. Client checks role → Super admin detected
3. Client redirects to `/admin/dashboard`
4. Server receives request → Cookie NOT available yet
5. `requireSuperAdmin()` doesn't find user → Redirects to `/login`

## Debugging Commands

### Check Cookie in Browser:
```javascript
// In browser console (F12)
document.cookie
// Should see Supabase auth cookies
```

### Check Session in Browser:
```javascript
// In browser console (F12)
const { createClient } = await import('/lib/supabase/client.js')
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

### Check Server-Side Session:
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.sessions 
WHERE user_id = '655ca435-ea20-4dea-817e-4ae1bdf8e86c'
ORDER BY updated_at DESC
LIMIT 1;
```

## Alternative Solutions

### Option 1: Use Client-Side Redirect with Retry
```typescript
// In LoginForm.tsx
if (tenantUsers && tenantUsers.length > 0) {
  // Try redirect, if fails, retry after delay
  router.push('/admin/dashboard')
  setTimeout(() => {
    if (window.location.pathname === '/login') {
      // Retry redirect
      window.location.href = '/admin/dashboard'
    }
  }, 500)
}
```

### Option 2: Use Server-Side Redirect
Create an API route that handles the redirect:
```typescript
// app/api/auth/redirect/route.ts
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Check role and redirect
}
```

### Option 3: Use Next.js Middleware for Redirect
Handle the redirect entirely in middleware after login.

## Current Status
- ✅ Enhanced logging added
- ✅ Cookie sync delay increased
- ✅ Using `router.push()` instead of `window.location.href`
- ✅ Added `router.refresh()` for server-side re-render
- ✅ Middleware enhanced with super admin check
- ⚠️ **Testing needed** - Please test and check server logs

## Next Steps
1. Test login with enhanced logging
2. Check server console for `[requireSuperAdmin]` logs
3. If issue persists, check cookie settings in Supabase
4. Verify RLS policies allow reading `tenant_users` table
5. Check if cookie domain/path settings are correct

## Related Files
- `lib/admin/auth.ts` - `requireSuperAdmin()` function
- `components/auth/LoginForm.tsx` - Login form with redirect logic
- `lib/supabase/middleware.ts` - Middleware with super admin check
- `app/admin/layout.tsx` - Admin layout using `requireSuperAdmin()`



