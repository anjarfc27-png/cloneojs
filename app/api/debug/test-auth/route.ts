/**
 * Debug endpoint to test authorization
 * Access: http://localhost:3000/api/debug/test-auth
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not logged in',
        userError: userError?.message,
      }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Step 1: Check super_admin role exists
    const { data: superAdminRoles, error: roleError } = await adminClient
      .from('roles')
      .select('id, role_key, name')
      .eq('role_key', 'super_admin')
      .limit(1)

    // Step 2: Check user_role_assignments
    let roleAssignments = null
    if (superAdminRoles && superAdminRoles.length > 0) {
      const { data, error } = await adminClient
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_id', superAdminRoles[0].id)
        .eq('is_active', true)
      
      roleAssignments = data
    }

    // Step 3: Check tenant_users (backward compatibility)
    const { data: tenantUsers } = await adminClient
      .from('tenant_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)

    // Step 4: Test checkSuperAdmin function
    const authCheck = await checkSuperAdmin()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      superAdminRoles,
      roleError: roleError?.message,
      roleAssignments,
      tenantUsers,
      authCheck: {
        authorized: authCheck.authorized,
        error: authCheck.error ? 'Has error' : null,
      },
      isSuperAdmin: authCheck.authorized,
      diagnosis: {
        hasUser: !!user,
        hasSuperAdminRole: superAdminRoles && superAdminRoles.length > 0,
        hasRoleAssignment: roleAssignments && roleAssignments.length > 0,
        hasTenantUser: tenantUsers && tenantUsers.length > 0,
        checkSuperAdminWorks: authCheck.authorized,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

