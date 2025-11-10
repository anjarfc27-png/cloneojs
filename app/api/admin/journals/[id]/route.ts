import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/admin/journals/[id] - Update a journal
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
    const { title, description, issn, e_issn, editor_id, is_active } = body

    // Update journal
    const { data: journal, error } = await supabase
      .from('journals')
      .update({
        title,
        description: description || null,
        issn: issn || null,
        e_issn: e_issn || null,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating journal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Journal updated successfully',
      journal,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/journals/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/journals/[id] - Delete a journal
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

    // Delete journal (cascade will handle related records)
    const { error } = await supabase.from('journals').delete().eq('id', params.id)

    if (error) {
      console.error('Error deleting journal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Journal deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/journals/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

