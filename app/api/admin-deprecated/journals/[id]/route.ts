import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * PUT /api/admin/journals/[id] - Update a journal
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
    const { supabase } = authCheck

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
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

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

