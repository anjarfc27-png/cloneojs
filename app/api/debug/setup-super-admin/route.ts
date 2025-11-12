import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get target email from request
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get target user by email
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has super admin role
    const { data: existingRole } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', targetUser.id)
      .eq('role', 'super_admin')
      .single()

    if (existingRole) {
      return NextResponse.json(
        { message: 'User is already super admin', user: targetUser },
        { status: 200 }
      )
    }

    // Create or update super admin role
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .upsert({
        user_id: targetUser.id,
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
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: 'super_admin',
        tenant_id: tenantUser.tenant_id,
        is_active: tenantUser.is_active
      }
    })

  } catch (error: any) {
    console.error('Error creating super admin:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check setup status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if anjarbdn@gmail.com is super admin
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'anjarbdn@gmail.com')
      .single()

    if (!targetUser) {
      return NextResponse.json({
        exists: false,
        message: 'User anjarbdn@gmail.com not found'
      })
    }

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role, is_active')
      .eq('user_id', targetUser.id)
      .single()

    return NextResponse.json({
      exists: true,
      email: targetUser.email,
      role: tenantUser?.role || 'none',
      is_active: tenantUser?.is_active || false,
      is_super_admin: tenantUser?.role === 'super_admin'
    })

  } catch (error: any) {
    console.error('Error checking setup status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}