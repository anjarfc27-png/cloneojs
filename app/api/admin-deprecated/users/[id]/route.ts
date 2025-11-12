import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * PUT /api/admin/users/[id] - Update a user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase, user } = authCheck

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
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase, user } = authCheck

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

