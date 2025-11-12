import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/debug/setup-super-admin-direct
 * Setup super admin directly with user_id (for direct setup)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { user_id, email } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    console.log(`[SETUP SUPER ADMIN DIRECT] Setting up super admin for user_id: ${user_id}`)

    // Check if default tenant exists, if not create it
    let { data: defaultTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'default-journal')
      .single()

    if (!defaultTenant) {
      console.log('[SETUP SUPER ADMIN DIRECT] Creating default tenant...')
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
        console.error('[SETUP SUPER ADMIN DIRECT] Error creating tenant:', tenantError)
        return NextResponse.json(
          { error: 'Failed to create default tenant', details: tenantError.message },
          { status: 500 }
        )
      }

      defaultTenant = newTenant
      console.log('[SETUP SUPER ADMIN DIRECT] Default tenant created:', defaultTenant.id)
    }

    // Check if user already has a role in this tenant
    const { data: existingTenantUser, error: checkError } = await supabase
      .from('tenant_users')
      .select('id, role, is_active')
      .eq('user_id', user_id)
      .eq('tenant_id', defaultTenant.id)
      .maybeSingle()

    // Ignore error if user doesn't have entry yet (we'll create one)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[SETUP SUPER ADMIN DIRECT] Error checking existing tenant user:', checkError)
    }

    if (existingTenantUser) {
      // Update existing role to super_admin
      console.log('[SETUP SUPER ADMIN DIRECT] Updating existing role to super_admin...')
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
        console.error('[SETUP SUPER ADMIN DIRECT] Error updating role:', updateError)
        return NextResponse.json(
          { error: 'Failed to update role', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Super admin role updated successfully',
        user: {
          id: user_id,
          email: email || 'unknown',
          role: 'super_admin',
          tenant_id: defaultTenant.id,
          is_active: true,
        },
        action: 'updated',
      })
    } else {
      // Create new tenant_user with super_admin role
      console.log('[SETUP SUPER ADMIN DIRECT] Creating new super admin role...')
      const { data: newTenantUser, error: insertError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: user_id,
          tenant_id: defaultTenant.id,
          role: 'super_admin',
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[SETUP SUPER ADMIN DIRECT] Error creating role:', insertError)
        return NextResponse.json(
          { error: 'Failed to create super admin role', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Super admin role created successfully',
        user: {
          id: user_id,
          email: email || 'unknown',
          role: 'super_admin',
          tenant_id: defaultTenant.id,
          is_active: true,
        },
        action: 'created',
      })
    }
  } catch (error: any) {
    console.error('[SETUP SUPER ADMIN DIRECT] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}



