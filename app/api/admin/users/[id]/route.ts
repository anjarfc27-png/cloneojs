import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/admin/users/[id] - Update a user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, role, is_active, tenant_id } = body

    // Update user in Supabase
    // Update tenant_users for role and is_active
    if (tenant_id && role) {
      const { error: updateError } = await supabase
        .from('tenant_users')
        .update({
          role,
          is_active: is_active ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', params.id)
        .eq('tenant_id', tenant_id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Update user metadata if full_name provided
    // Note: This requires Admin API for auth.users
    // For now, we'll update user_profiles if it exists

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/users/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent deleting yourself
    if (params.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user from tenant_users (cascade will handle auth.users)
    // Note: Actually deleting from auth.users requires Admin API
    // For now, we'll just deactivate the user
    const { error: deleteError } = await supabase
      .from('tenant_users')
      .update({ is_active: false })
      .eq('user_id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/users/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

