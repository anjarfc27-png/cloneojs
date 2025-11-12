import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/announcements/[id]
 * Get single announcement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { data: announcement, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching announcement:', error)
      return NextResponse.json(
        { error: 'Failed to fetch announcement', details: error.message },
        { status: 500 }
      )
    }

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      announcement,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/announcements/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/announcements/[id]
 * Update announcement
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

    const { title, description, short_description, type, enabled, date_expire } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) {
      updateData.title = title
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (short_description !== undefined) {
      updateData.short_description = short_description
    }

    if (type !== undefined) {
      updateData.type = type
    }

    if (enabled !== undefined) {
      updateData.enabled = enabled
    }

    if (date_expire !== undefined) {
      updateData.date_expire = date_expire
    }

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      return NextResponse.json(
        { error: 'Failed to update announcement', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'announcement_updated',
      'announcement',
      params.id,
      { title: data.title }
    )

    return NextResponse.json({
      message: 'Announcement updated successfully',
      announcement: data,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/announcements/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Delete announcement
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

    const { data, error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting announcement:', error)
      return NextResponse.json(
        { error: 'Failed to delete announcement', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'announcement_deleted',
      'announcement',
      params.id,
      { title: data?.title }
    )

    return NextResponse.json({
      message: 'Announcement deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/announcements/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

