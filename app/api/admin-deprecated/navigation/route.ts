import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/navigation
 * Get all navigation menus
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { data: menus, error } = await supabase
      .from('navigation_menus')
      .select('*')
      .order('sequence', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching navigation menus:', error)
      return NextResponse.json(
        { error: 'Failed to fetch navigation menus', details: error.message },
        { status: 500 }
      )
    }

    // Build tree structure
    const menuTree = buildMenuTree(menus || [])

    return NextResponse.json({
      menus: menus || [],
      tree: menuTree,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/navigation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/navigation
 * Create new navigation menu item
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck
    const body = await request.json()

    const { name, title, url, menu_type, parent_id, sequence, enabled, target_blank } = body

    if (!name || !title) {
      return NextResponse.json(
        { error: 'name and title are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('navigation_menus')
      .insert({
        name,
        title,
        url: url || null,
        menu_type: menu_type || 'custom',
        parent_id: parent_id || null,
        sequence: sequence || 0,
        enabled: enabled !== undefined ? enabled : true,
        target_blank: target_blank || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating navigation menu:', error)
      return NextResponse.json(
        { error: 'Failed to create navigation menu', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'navigation_menu_created',
      'navigation_menu',
      data.id,
      { name, title }
    )

    return NextResponse.json({
      message: 'Navigation menu created successfully',
      menu: data,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/navigation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Helper function to build menu tree
 */
function buildMenuTree(menus: any[]): any[] {
  const menuMap = new Map()
  const roots: any[] = []

  // Create map of all menus
  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })

  // Build tree
  menus.forEach(menu => {
    const menuNode = menuMap.get(menu.id)
    if (menu.parent_id) {
      const parent = menuMap.get(menu.parent_id)
      if (parent) {
        parent.children.push(menuNode)
      }
    } else {
      roots.push(menuNode)
    }
  })

  // Sort by sequence
  const sortBySequence = (a: any, b: any) => a.sequence - b.sequence
  roots.sort(sortBySequence)
  roots.forEach(root => {
    if (root.children) {
      root.children.sort(sortBySequence)
    }
  })

  return roots
}

