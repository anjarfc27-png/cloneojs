import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/debug/check-super-admin
 * Check if a user is super admin
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'anjarbdn@gmail.com'

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Get user by email from tenant_users
    // We need to find user_id first by checking tenant_users
    const { data: allTenantUsers, error: tenantError } = await supabase
      .from('tenant_users')
      .select('user_id, role, is_active, tenant_id')
      .eq('role', 'super_admin')
      .eq('is_active', true)
      .limit(100)

    if (tenantError) {
      console.error('Error fetching tenant users:', tenantError)
    }

    // Check if current user is super admin
    let currentUserIsSuperAdmin = false
    if (currentUser) {
      const { data: currentUserRole } = await supabase
        .from('tenant_users')
        .select('role, is_active')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .eq('role', 'super_admin')
        .single()

      currentUserIsSuperAdmin = !!currentUserRole
    }

    // Try to find user by checking tenant_users and matching with current user
    // Since we can't directly query auth.users, we'll check if current user matches
    const isTargetSuperAdmin = currentUser && 
      currentUser.email === email && 
      currentUserIsSuperAdmin

    return NextResponse.json({
      email,
      current_user: {
        email: currentUser?.email || null,
        id: currentUser?.id || null,
        is_super_admin: currentUserIsSuperAdmin,
      },
      target_email: email,
      is_target_super_admin: isTargetSuperAdmin || false,
      all_super_admins: allTenantUsers?.map(tu => ({
        user_id: tu.user_id,
        role: tu.role,
        is_active: tu.is_active,
        tenant_id: tu.tenant_id,
      })) || [],
      message: currentUserIsSuperAdmin 
        ? `User ${currentUser?.email} is super admin`
        : `User ${currentUser?.email || 'not logged in'} is not super admin`,
    })
  } catch (error: any) {
    console.error('Error checking super admin:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}



