/**
 * Debug endpoint to check database directly
 * This bypasses all auth checks and queries the database directly
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'anjarbdn@gmail.com'

    const adminClient = createAdminClient()

    // 1. Find user by email
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to list users',
        details: authError.message,
      }, { status: 500 })
    }

    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email,
        totalUsers: authUsers.users.length,
      }, { status: 404 })
    }

    // 2. Check roles table
    const { data: superAdminRole, error: roleError } = await adminClient
      .from('roles')
      .select('id, role_key, name')
      .eq('role_key', 'super_admin')
      .limit(1)
      .maybeSingle()

    if (roleError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query roles',
        details: roleError.message,
      }, { status: 500 })
    }

    if (!superAdminRole) {
      return NextResponse.json({
        success: false,
        error: 'super_admin role not found in roles table',
        user: {
          id: user.id,
          email: user.email,
        },
      }, { status: 404 })
    }

    // 3. Check user_role_assignments
    const { data: roleAssignments, error: assignmentError } = await adminClient
      .from('user_role_assignments')
      .select('id, user_id, role_id, tenant_id, journal_id, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('role_id', superAdminRole.id)
      .eq('is_active', true)

    if (assignmentError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query user_role_assignments',
        details: assignmentError.message,
      }, { status: 500 })
    }

    // 4. Check tenant_users (old structure)
    const { data: tenantUsers, error: tenantError } = await adminClient
      .from('tenant_users')
      .select('id, user_id, tenant_id, role, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)

    if (tenantError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query tenant_users',
        details: tenantError.message,
      }, { status: 500 })
    }

    // 5. Get all roles for this user
    const { data: allRoleAssignments, error: allRolesError } = await adminClient
      .from('user_role_assignments')
      .select(`
        id,
        user_id,
        role_id,
        tenant_id,
        journal_id,
        is_active,
        roles:role_id (
          id,
          role_key,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    // 6. Check if user has active session in auth
    const { data: { users: allAuthUsers } } = await adminClient.auth.admin.listUsers()
    const authUser = allAuthUsers.find(u => u.id === user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
      },
      superAdminRole: {
        id: superAdminRole.id,
        role_key: superAdminRole.role_key,
        name: superAdminRole.name,
      },
      roleAssignments: {
        superAdmin: roleAssignments || [],
        all: allRoleAssignments || [],
        count: roleAssignments?.length || 0,
      },
      tenantUsers: tenantUsers || [],
      diagnosis: {
        hasSuperAdminRole: !!superAdminRole,
        hasActiveSuperAdminAssignment: (roleAssignments?.length || 0) > 0,
        hasSuperAdminInTenantUsers: (tenantUsers?.length || 0) > 0,
        isSuperAdmin: (roleAssignments?.length || 0) > 0 || (tenantUsers?.length || 0) > 0,
        hasEmailConfirmed: !!user.email_confirmed_at,
        hasRecentSignIn: user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() > Date.now() - 86400000 : false,
      },
      fixNeeded: {
        needsRoleAssignment: (roleAssignments?.length || 0) === 0,
        needsTenantUser: (tenantUsers?.length || 0) === 0,
        needsEmailConfirmation: !user.email_confirmed_at,
      },
      sqlFix: {
        addRoleAssignment: roleAssignments?.length === 0 ? `
-- Add super admin role assignment
-- Replace TENANT_ID with an actual tenant_id from your tenants table
INSERT INTO user_role_assignments (user_id, role_id, tenant_id, is_active)
VALUES (
  '${user.id}',
  '${superAdminRole.id}',
  (SELECT id FROM tenants LIMIT 1), -- Use first tenant or replace with specific tenant_id
  true
)
ON CONFLICT DO NOTHING;
        `.trim() : null,
        addTenantUser: tenantUsers?.length === 0 ? `
-- Add tenant user (old structure)
-- Replace TENANT_ID with an actual tenant_id from your tenants table
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
VALUES (
  '${user.id}',
  (SELECT id FROM tenants LIMIT 1), -- Use first tenant or replace with specific tenant_id
  'super_admin',
  true
)
ON CONFLICT DO NOTHING;
        `.trim() : null,
      },
    })
  } catch (error: any) {
    console.error('[check-database] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

