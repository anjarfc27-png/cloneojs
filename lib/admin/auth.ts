/**
 * Admin authentication utilities
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

/**
 * Check if user is super admin (for API routes)
 * Returns null if authorized, or NextResponse with error if not authorized
 */
export async function checkSuperAdmin() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[checkSuperAdmin] Error getting user:', userError?.message)
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        user: null,
        supabase: null,
      }
    }

    // Check if user is super admin using new structure (user_role_assignments)
    // This is backward compatible - will also check tenant_users if needed
    let isSuperAdmin = false

    // Try new structure first (user_role_assignments)
    // Step 1: Get super_admin role ID
    const { data: superAdminRole, error: roleLookupError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_key', 'super_admin')
      .maybeSingle()

    if (!roleLookupError && superAdminRole) {
      // Step 2: Check if user has this role
      const { data: roleAssignments, error: assignmentError } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('role_id', superAdminRole.id)
        .eq('is_active', true)
        .limit(1)

      if (!assignmentError && roleAssignments && roleAssignments.length > 0) {
        isSuperAdmin = true
      }
    }

    // Fallback to old structure (tenant_users) for backward compatibility
    if (!isSuperAdmin) {
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('role, tenant_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('role', 'super_admin')
        .limit(1)

      if (!tenantError && tenantUsers && tenantUsers.length > 0) {
        isSuperAdmin = true
      }
    }

    if (!isSuperAdmin) {
      console.log('[checkSuperAdmin] User is not super admin')
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        user: null,
        supabase: null,
      }
    }

    return {
      authorized: true,
      error: null,
      user,
      supabase,
    }
  } catch (error: any) {
    console.error('[checkSuperAdmin] Unexpected error:', error?.message)
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
    
    // Try to get user - might fail if cookie not synced yet
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
      console.error('[requireSuperAdmin] Error details:', JSON.stringify(userError, null, 2))
      
      // Check if this might be a cookie sync issue (common after login)
      const errorMessage = userError.message?.toLowerCase() || ''
      const isCookieSyncIssue = errorMessage.includes('cookie') || 
                                errorMessage.includes('session') ||
                                errorMessage.includes('jwt') ||
                                (userError as any)?.status === 401
      
      if (isCookieSyncIssue) {
        console.log('[requireSuperAdmin] ⚠️ Possible cookie sync issue, returning null for client-side handling')
        // Return null user - client-side will handle verification
        return { user: null, supabase }
      }
      
      // For other errors, redirect to login
      redirect('/login')
    }

    if (!user) {
      console.log('[requireSuperAdmin] No user found, returning null for client-side handling')
      // Return null user - client-side will handle verification
      return { user: null, supabase }
    }

    console.log('[requireSuperAdmin] User found:', user.email, 'ID:', user.id)

    // Check if user is super admin using new structure (user_role_assignments)
    // This is backward compatible - will also check tenant_users if needed
    console.log('[requireSuperAdmin] Checking super admin role...')
    let isSuperAdmin = false

    // Try new structure first (user_role_assignments)
    // Step 1: Get super_admin role ID
    const { data: superAdminRole, error: roleLookupError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_key', 'super_admin')
      .maybeSingle()

    if (!roleLookupError && superAdminRole) {
      // Step 2: Check if user has this role
      const { data: roleAssignments, error: assignmentError } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('role_id', superAdminRole.id)
        .eq('is_active', true)
        .limit(1)

      if (!assignmentError && roleAssignments && roleAssignments.length > 0) {
        isSuperAdmin = true
        console.log('[requireSuperAdmin] User is super admin (via user_role_assignments)')
      }
    }

    // Fallback to old structure (tenant_users) for backward compatibility
    if (!isSuperAdmin) {
      console.log('[requireSuperAdmin] Trying old structure (tenant_users)...')
      const { data: tenantUsers, error: tenantError } = await supabase
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

