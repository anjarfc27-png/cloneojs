/**
 * Check specific user's role
 * Access: http://localhost:3000/api/debug/check-user-role?email=anjarbdn@gmail.com
 */

import { createAdminClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email') || 'anjarbdn@gmail.com'

    const adminClient = createAdminClient()

    // Get user from auth.users
    const { data: usersList } = await adminClient.auth.admin.listUsers()
    const user = usersList?.users.find((u: any) => u.email === email)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: `User with email ${email} not found`,
        availableUsers: usersList?.users.map((u: any) => ({ id: u.id, email: u.email })),
      }, { status: 404 })
    }

    // Get super_admin role
    const { data: superAdminRoles } = await adminClient
      .from('roles')
      .select('id, role_key, name')
      .eq('role_key', 'super_admin')
      .limit(1)

    // Check user_role_assignments
    let roleAssignments = null
    if (superAdminRoles && superAdminRoles.length > 0) {
      const { data, error } = await adminClient
        .from('user_role_assignments')
        .select(`
          *,
          roles:role_id (id, role_key, name)
        `)
        .eq('user_id', user.id)
        .eq('role_id', superAdminRoles[0].id)
      
      roleAssignments = { data, error: error?.message }
    }

    // Check tenant_users (backward compatibility)
    const { data: tenantUsers, error: tenantError } = await adminClient
      .from('tenant_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')

    // Check all role assignments for this user
    const { data: allRoleAssignments } = await adminClient
      .from('user_role_assignments')
      .select(`
        *,
        roles:role_id (id, role_key, name)
      `)
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      superAdminRole: superAdminRoles?.[0] || null,
      roleAssignments: {
        superAdmin: roleAssignments?.data || [],
        all: allRoleAssignments || [],
        error: roleAssignments?.error,
      },
      tenantUsers: tenantUsers || [],
      tenantUsersError: tenantError?.message,
      diagnosis: {
        hasSuperAdminRole: superAdminRoles && superAdminRoles.length > 0,
        hasActiveSuperAdminAssignment: roleAssignments?.data?.some((ra: any) => ra.is_active === true) || false,
        hasSuperAdminInTenantUsers: tenantUsers && tenantUsers.some((tu: any) => tu.is_active === true) || false,
        isSuperAdmin: (roleAssignments?.data?.some((ra: any) => ra.is_active === true) || 
                      (tenantUsers && tenantUsers.some((tu: any) => tu.is_active === true))),
      },
      fixNeeded: {
        needsRoleAssignment: !roleAssignments?.data?.some((ra: any) => ra.is_active === true),
        needsTenantUser: !tenantUsers?.some((tu: any) => tu.is_active === true),
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

