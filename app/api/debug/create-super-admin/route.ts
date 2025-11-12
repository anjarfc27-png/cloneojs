import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is already super admin
    const { data: existingUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'User is already super admin', user: existingUser },
        { status: 200 }
      )
    }

    // Create super admin role
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .upsert({
        user_id: user.id,
        tenant_id: 'default-tenant', // Default tenant
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating super admin:', tenantError)
      return NextResponse.json(
        { error: 'Failed to create super admin role', details: tenantError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Super admin role created successfully',
      user: tenantUser
    })

  } catch (error: any) {
    console.error('Error creating super admin:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role, tenant_id, is_active')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: tenantUser?.role || 'none',
        tenant_id: tenantUser?.tenant_id,
        is_active: tenantUser?.is_active
      }
    })

  } catch (error: any) {
    console.error('Error checking user role:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}