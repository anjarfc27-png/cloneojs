import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/debug/setup-super-admin-v2
 * Setup super admin for current logged in user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const email = body.email || 'anjarbdn@gmail.com'

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated. Please login first.' },
        { status: 401 }
      )
    }

    // Verify email matches (security check)
    if (user.email !== email) {
      return NextResponse.json(
        { error: `Email mismatch. You are logged in as ${user.email}, but trying to setup ${email}` },
        { status: 403 }
      )
    }

    console.log(`[SETUP SUPER ADMIN] Setting up super admin for: ${email} (${user.id})`)

    // Check if default tenant exists, if not create it
    let { data: defaultTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'default-journal')
      .single()

    if (!defaultTenant) {
      console.log('[SETUP SUPER ADMIN] Creating default tenant...')
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Default Journal',
          slug: 'default-journal',
          description: 'Default journal for super admin',
          is_active: true,
        })
        .select()
        .single()

      if (tenantError) {
        console.error('[SETUP SUPER ADMIN] Error creating tenant:', tenantError)
        return NextResponse.json(
          { error: 'Failed to create default tenant', details: tenantError.message },
          { status: 500 }
        )
      }

      defaultTenant = newTenant
      console.log('[SETUP SUPER ADMIN] Default tenant created:', defaultTenant.id)
    }

    // Check if user already has a role in this tenant
    const { data: existingTenantUser, error: checkError } = await supabase
      .from('tenant_users')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('tenant_id', defaultTenant.id)
      .maybeSingle()

    // Ignore error if user doesn't have entry yet (we'll create one)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[SETUP SUPER ADMIN] Error checking existing tenant user:', checkError)
    }

    if (existingTenantUser) {
      // Update existing role to super_admin
      console.log('[SETUP SUPER ADMIN] Updating existing role to super_admin...')
      const { data: updated, error: updateError } = await supabase
        .from('tenant_users')
        .update({
          role: 'super_admin',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTenantUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('[SETUP SUPER ADMIN] Error updating role:', updateError)
        return NextResponse.json(
          { error: 'Failed to update role', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Super admin role updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: 'super_admin',
          tenant_id: defaultTenant.id,
          is_active: true,
        },
        action: 'updated',
      })
    } else {
      // Create new tenant_user with super_admin role
      console.log('[SETUP SUPER ADMIN] Creating new super admin role...')
      const { data: newTenantUser, error: insertError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: user.id,
          tenant_id: defaultTenant.id,
          role: 'super_admin',
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[SETUP SUPER ADMIN] Error creating role:', insertError)
        return NextResponse.json(
          { error: 'Failed to create super admin role', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Super admin role created successfully',
        user: {
          id: user.id,
          email: user.email,
          role: 'super_admin',
          tenant_id: defaultTenant.id,
          is_active: true,
        },
        action: 'created',
      })
    }
  } catch (error: any) {
    console.error('[SETUP SUPER ADMIN] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/debug/setup-super-admin-v2
 * Check current user super admin status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        message: 'User not authenticated',
      })
    }

    // Check if user is super admin (handle multiple entries)
    const { data: tenantUsers, error: tenantError } = await supabase
      .from('tenant_users')
      .select('id, role, is_active, tenant_id, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .limit(1)

    if (tenantError) {
      console.error('Error checking super admin status:', tenantError)
    }

    const tenantUser = tenantUsers && tenantUsers.length > 0 ? tenantUsers[0] : null

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      is_super_admin: !!tenantUser,
      role: tenantUser?.role || null,
      tenant_id: tenantUser?.tenant_id || null,
      created_at: tenantUser?.created_at || null,
      message: tenantUser 
        ? `User ${user.email} is super admin`
        : `User ${user.email} is not super admin`,
    })
  } catch (error: any) {
    console.error('Error checking super admin status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

