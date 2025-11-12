/**
 * Admin authentication utilities
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Check if user is super admin (for Server Actions and API routes)
 * Returns authorization status and user info
 * 
 * For Server Actions: returns simple boolean
 * For API routes: returns NextResponse error if not authorized
 */
export async function checkSuperAdmin(accessToken?: string) {
  try {
    console.log('[checkSuperAdmin] Starting authorization check...')
    const { createAdminClient } = await import('@/lib/db/supabase-admin')
    const adminClient = createAdminClient()
    const cookieStore = cookies()
    const userIdFromCookie = cookieStore.get('sb-super-admin-user')?.value

    let user: any = null
    let supabase: any = null
    let usedAccessToken = false

    // Prefer access token if provided (client-side can supply this)
    if (accessToken) {
      console.log('[checkSuperAdmin] Access token provided, verifying via admin API...')
      try {
        const { data: tokenUser, error: tokenError } = await adminClient.auth.getUser(accessToken)
        if (tokenError) {
          console.warn('[checkSuperAdmin] Access token verification error:', tokenError.message)
        } else if (tokenUser?.user) {
          user = tokenUser.user
          usedAccessToken = true
          console.log('[checkSuperAdmin] ✅ User obtained via access token:', user.email)
        }
      } catch (tokenErr: any) {
        console.warn('[checkSuperAdmin] Exception verifying access token:', tokenErr?.message)
      }
    }

    if (!user) {
      console.log('[checkSuperAdmin] Falling back to session cookies...')
      supabase = await createClient()
      
      console.log('[checkSuperAdmin] Getting user from session...')
      
      // IMPORTANT: For Server Actions, we need to explicitly refresh session
      // because cookies might not be immediately available
      // Try getSession first to check if we have a valid session
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError && process.env.NODE_ENV === 'development') {
        console.warn('[checkSuperAdmin] Session error:', sessionError.message)
      }
      
      // If no session, try to refresh from cookies
      if (!session) {
        console.log('[checkSuperAdmin] No session found, trying refresh from cookies...')
        
        // Try refreshSession - this will use the refresh token from cookies
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshData?.session) {
          session = refreshData.session
          console.log('[checkSuperAdmin] ✅ Session refreshed from cookies')
        } else if (refreshError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[checkSuperAdmin] Refresh error:', refreshError.message)
            console.warn('[checkSuperAdmin] This might mean cookies are not synced or expired')
          }
        }
      }
      
      // Now try getUser - this should work if session exists or was refreshed
      // getUser() will also try to refresh if needed
      const {
        data: { user: sessionUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error('[checkSuperAdmin] ❌ Error getting user:', userError.message)
        console.error('[checkSuperAdmin] Error code:', (userError as any)?.code)
        console.error('[checkSuperAdmin] Error status:', (userError as any)?.status)
        return {
          authorized: false,
          error: NextResponse.json({ error: 'Unauthorized', details: userError.message }, { status: 401 }),
          user: null,
          supabase: null,
        }
      }

      if (!sessionUser) {
        console.error('[checkSuperAdmin] ❌ No user found in session')
        console.error('[checkSuperAdmin] This usually means:')
        console.error('  1. User is not logged in')
        console.error('  2. Session cookie is not synced')
        console.error('  3. Server Action called from client without proper session')
      } else {
        user = sessionUser
        console.log('[checkSuperAdmin] ✅ User found via session:', user.email, 'ID:', user.id)
      }
    } else {
      console.log('[checkSuperAdmin] Using user derived from access token, skipping session lookup')
    }

    if (!user && userIdFromCookie) {
      console.log('[checkSuperAdmin] Trying cookie fallback for user ID:', userIdFromCookie)
      try {
        const { data: cookieUser, error: cookieError } = await adminClient.auth.admin.getUserById(
          userIdFromCookie
        )
        if (cookieError) {
          console.warn('[checkSuperAdmin] Cookie fallback error:', cookieError.message)
        } else if (cookieUser?.user) {
          user = cookieUser.user
          console.log('[checkSuperAdmin] ✅ User obtained via cookie fallback:', user.email)
        }
      } catch (cookieErr: any) {
        console.warn('[checkSuperAdmin] Exception during cookie fallback:', cookieErr?.message)
      }
    }

    if (!user) {
      console.log('[checkSuperAdmin] ❌ Unable to determine user identity')
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Unauthorized', details: 'Unable to determine user' }, { status: 401 }),
        user: null,
        supabase: null,
      }
    }

    // Check if user is super admin using new structure (user_role_assignments)
    // This is backward compatible - will also check tenant_users if needed
    // 
    // IMPORTANT: System supports MULTIPLE super admin users (for Indonesia use case)
    // - Only 1 role definition with role_key 'super_admin' in roles table
    // - But many users can have super_admin role via user_role_assignments
    let isSuperAdmin = false

    // Try new structure first (user_role_assignments)
    // Step 1: Get super_admin role ID (should be only 1 role definition)
    // Note: Using limit(1) to handle edge case if duplicate role definitions exist
    const { data: superAdminRoles, error: roleLookupError } = await adminClient
      .from('roles')
      .select('id')
      .eq('role_key', 'super_admin')
      .limit(1) // Get first super_admin role definition (table roles doesn't have is_active column)

    if (!roleLookupError && superAdminRoles && superAdminRoles.length > 0) {
      const superAdminRoleId = superAdminRoles[0].id
      console.log('[checkSuperAdmin] Found super_admin role ID:', superAdminRoleId)
      
      // Step 2: Check if user has this role
      // Multiple users can have super_admin role - this query checks if current user has it
      // Note: Super admin can have tenant_id (for multi-tenant) or NULL (site-level)
      const { data: roleAssignments, error: assignmentError } = await adminClient
        .from('user_role_assignments')
        .select('id, tenant_id, journal_id')
        .eq('user_id', user.id)
        .eq('role_id', superAdminRoleId)
        .eq('is_active', true)
        .limit(1) // Only need to check if user has the role, not count how many

      console.log('[checkSuperAdmin] Role assignments query result:', {
        found: roleAssignments?.length || 0,
        error: assignmentError?.message,
        assignments: roleAssignments,
      })

      if (!assignmentError && roleAssignments && roleAssignments.length > 0) {
        isSuperAdmin = true
        console.log('[checkSuperAdmin] ✅ User is super admin (via user_role_assignments)')
      } else if (assignmentError) {
        console.error('[checkSuperAdmin] Error checking role assignments:', assignmentError)
      }
    } else if (roleLookupError) {
      console.error('[checkSuperAdmin] Error looking up super_admin role:', roleLookupError)
    } else {
      console.warn('[checkSuperAdmin] No super_admin role found in roles table')
    }

    // Fallback to old structure (tenant_users) for backward compatibility
    if (!isSuperAdmin) {
      console.log('[checkSuperAdmin] Trying fallback: tenant_users table...')
      const { data: tenantUsers, error: tenantError } = await adminClient
        .from('tenant_users')
        .select('role, tenant_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('role', 'super_admin')
        .limit(1)

      console.log('[checkSuperAdmin] Tenant users query result:', {
        found: tenantUsers?.length || 0,
        error: tenantError?.message,
        users: tenantUsers,
      })

      if (!tenantError && tenantUsers && tenantUsers.length > 0) {
        isSuperAdmin = true
        console.log('[checkSuperAdmin] ✅ User is super admin (via tenant_users)')
      } else if (tenantError) {
        console.error('[checkSuperAdmin] Error checking tenant users:', tenantError)
      }
    }

    if (!isSuperAdmin) {
      console.log('[checkSuperAdmin] ❌ User is NOT super admin. User ID:', user.id, 'Email:', user.email)
      console.log('[checkSuperAdmin] Debug info: Check if role assignments exist in database')
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        user: null,
        supabase: null,
      }
    }

    console.log('[checkSuperAdmin] ✅ User is authorized as super admin:', user.email)
    return {
      authorized: true,
      error: null,
      user,
      supabase: usedAccessToken ? null : supabase,
    }
  } catch (error: any) {
    console.error('[checkSuperAdmin] Unexpected error:', error?.message)
    console.error('[checkSuperAdmin] Error stack:', error?.stack)
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      user: null,
      supabase: null,
    }
  }
}

export async function requireSuperAdmin() {
  try {
    const supabase = await createClient()
    
    console.log('[requireSuperAdmin] Checking authentication...')
    
    // IMPORTANT: Try getSession first, then refresh if needed
    // This helps with cookie sync issues in Server Components
    let { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError && process.env.NODE_ENV === 'development') {
      console.warn('[requireSuperAdmin] Session error:', sessionError.message)
    }
    
    // If no session, try to refresh from cookies
    if (!session) {
      console.log('[requireSuperAdmin] No session found, trying refresh from cookies...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshData?.session) {
        session = refreshData.session
        console.log('[requireSuperAdmin] ✅ Session refreshed from cookies')
      } else if (refreshError && process.env.NODE_ENV === 'development') {
        console.warn('[requireSuperAdmin] Refresh error:', refreshError.message)
      }
    }
    
    // Now try getUser - this should work if session exists or was refreshed
    let user = null
    let userError = null
    
    try {
      const result = await supabase.auth.getUser()
      user = result.data?.user || null
      userError = result.error
    } catch (err: any) {
      console.error('[requireSuperAdmin] Exception getting user:', err?.message)
      userError = err
    }

    // If error getting user, check if it's a cookie sync issue
    // For cookie sync issues, we'll let the client-side handle it
    if (userError) {
      console.error('[requireSuperAdmin] Error getting user:', userError.message)
      console.error('[requireSuperAdmin] Error code:', (userError as any)?.code)
      
      // Check if this might be a cookie sync issue (common after login)
      const errorMessage = userError.message?.toLowerCase() || ''
      const isCookieSyncIssue = errorMessage.includes('cookie') || 
                                errorMessage.includes('session') ||
                                errorMessage.includes('jwt') ||
                                errorMessage.includes('auth session missing') ||
                                (userError as any)?.status === 401
      
      if (isCookieSyncIssue) {
        console.log('[requireSuperAdmin] ⚠️ Cookie sync issue detected, returning null for client-side handling')
        console.log('[requireSuperAdmin] Client-side fallback will verify access')
        // Return null user - client-side will handle verification
        return { user: null, supabase }
      }
      
      // For other errors, redirect to login
      console.log('[requireSuperAdmin] Non-cookie error, redirecting to login')
      redirect('/login')
    }

    if (!user) {
      console.log('[requireSuperAdmin] No user found after refresh, returning null for client-side handling')
      console.log('[requireSuperAdmin] Client-side fallback will verify access')
      // Return null user - client-side will handle verification
      return { user: null, supabase }
    }

    console.log('[requireSuperAdmin] User found:', user.email, 'ID:', user.id)

    // Use admin client to bypass RLS for checking roles
    // This is safe because we're only checking authorization, not modifying data
    const { createAdminClient } = await import('@/lib/db/supabase-admin')
    const adminClient = createAdminClient()

    // Check if user is super admin using new structure (user_role_assignments)
    // This is backward compatible - will also check tenant_users if needed
    // 
    // IMPORTANT: System supports MULTIPLE super admin users (for Indonesia use case)
    // - Only 1 role definition with role_key 'super_admin' in roles table
    // - But many users can have super_admin role via user_role_assignments
    console.log('[requireSuperAdmin] Checking super admin role...')
    let isSuperAdmin = false

    // Try new structure first (user_role_assignments)
    // Step 1: Get super_admin role ID (should be only 1 role definition)
    // Note: Using limit(1) to handle edge case if duplicate role definitions exist
    const { data: superAdminRoles, error: roleLookupError } = await adminClient
      .from('roles')
      .select('id')
      .eq('role_key', 'super_admin')
      .limit(1) // Get first super_admin role definition (table roles doesn't have is_active column)

    if (!roleLookupError && superAdminRoles && superAdminRoles.length > 0) {
      const superAdminRoleId = superAdminRoles[0].id
      
      // Step 2: Check if user has this role
      // Multiple users can have super_admin role - this query checks if current user has it
      const { data: roleAssignments, error: assignmentError } = await adminClient
        .from('user_role_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('role_id', superAdminRoleId)
        .eq('is_active', true)
        .limit(1) // Only need to check if user has the role, not count how many

      if (!assignmentError && roleAssignments && roleAssignments.length > 0) {
        isSuperAdmin = true
        console.log('[requireSuperAdmin] User is super admin (via user_role_assignments)')
      }
    }

    // Fallback to old structure (tenant_users) for backward compatibility
    if (!isSuperAdmin) {
      console.log('[requireSuperAdmin] Trying old structure (tenant_users)...')
      const { data: tenantUsers, error: tenantError } = await adminClient
        .from('tenant_users')
        .select('role, tenant_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('role', 'super_admin')
        .limit(1)

      if (tenantError) {
        console.error('[requireSuperAdmin] Error checking tenant user:', tenantError.message)
        console.error('[requireSuperAdmin] Error code:', tenantError.code)
        
        // Check if this might be a temporary database/RLS issue
        const isTemporaryIssue = tenantError.code === 'PGRST116' || // No rows returned
                                 tenantError.code === '42501' ||    // Insufficient privilege
                                 tenantError.message?.includes('RLS')
        
        if (isTemporaryIssue) {
          console.log('[requireSuperAdmin] ⚠️ Possible temporary database issue, returning null for client-side handling')
          return { user: null, supabase }
        }
      }

      if (!tenantError && tenantUsers && tenantUsers.length > 0) {
        isSuperAdmin = true
        console.log('[requireSuperAdmin] User is super admin (via tenant_users)')
      }
    }

    if (!isSuperAdmin) {
      console.log('[requireSuperAdmin] User is not super admin, redirecting to dashboard')
      console.log('[requireSuperAdmin] User ID:', user.id)
      redirect('/dashboard')
    }

    console.log('[requireSuperAdmin] ✅ User is super admin, allowing access')
    return { user, supabase }
  } catch (error: any) {
    console.error('[requireSuperAdmin] Unexpected error:', error?.message)
    console.error('[requireSuperAdmin] Error stack:', error?.stack)
    // If it's a redirect error from Next.js, re-throw it
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    // For other errors, return null for client-side handling
    console.log('[requireSuperAdmin] ⚠️ Unexpected error, returning null for client-side handling')
    const supabase = await createClient()
    return { user: null, supabase }
  }
}

