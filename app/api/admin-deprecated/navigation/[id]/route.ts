import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/navigation/[id]
 * Get single navigation menu item
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

    const { data: menu, error } = await supabase
      .from('navigation_menus')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching navigation menu:', error)
      return NextResponse.json(
        { error: 'Failed to fetch navigation menu', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ menu })
  } catch (error: any) {
    console.error('Error in GET /api/admin/navigation/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/navigation/[id]
 * Update navigation menu item
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

    const { name, title, url, menu_type, parent_id, sequence, enabled, target_blank } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name
    if (title !== undefined) updateData.title = title
    if (url !== undefined) updateData.url = url
    if (menu_type !== undefined) updateData.menu_type = menu_type
    if (parent_id !== undefined) updateData.parent_id = parent_id
    if (sequence !== undefined) updateData.sequence = sequence
    if (enabled !== undefined) updateData.enabled = enabled
    if (target_blank !== undefined) updateData.target_blank = target_blank

    const { data, error } = await supabase
      .from('navigation_menus')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating navigation menu:', error)
      return NextResponse.json(
        { error: 'Failed to update navigation menu', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'navigation_menu_updated',
      'navigation_menu',
      params.id,
      { name, title }
    )

    return NextResponse.json({
      message: 'Navigation menu updated successfully',
      menu: data,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/navigation/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/navigation/[id]
 * Delete navigation menu item
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

    // Check if menu has children
    const { data: children } = await supabase
      .from('navigation_menus')
      .select('id')
      .eq('parent_id', params.id)
      .limit(1)

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete menu item with children. Please delete children first.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('navigation_menus')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting navigation menu:', error)
      return NextResponse.json(
        { error: 'Failed to delete navigation menu', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'navigation_menu_deleted',
      'navigation_menu',
      params.id,
      {}
    )

    return NextResponse.json({
      message: 'Navigation menu deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/navigation/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

