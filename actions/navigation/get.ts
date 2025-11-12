/**
 * Navigation Server Actions - Get
 * 
 * Server Actions for retrieving navigation menus.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'

export interface NavigationMenuWithRelations {
  id: string
  name: string
  title: string
  url: string | null
  menu_type: 'custom' | 'journal' | 'article' | 'issue'
  parent_id: string | null
  sequence: number
  enabled: boolean
  target_blank: boolean
  created_at: string
  updated_at: string
  children?: NavigationMenuWithRelations[]
}

/**
 * Build menu tree from flat menu list
 */
function buildMenuTree(menus: NavigationMenuWithRelations[]): NavigationMenuWithRelations[] {
  const menuMap = new Map<string, NavigationMenuWithRelations>()
  const roots: NavigationMenuWithRelations[] = []

  // Create map of all menus with children array
  menus.forEach((menu) => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })

  // Build tree structure
  menus.forEach((menu) => {
    const menuNode = menuMap.get(menu.id)!
    if (menu.parent_id && menuMap.has(menu.parent_id)) {
      const parent = menuMap.get(menu.parent_id)!
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(menuNode)
    } else {
      roots.push(menuNode)
    }
  })

  // Sort by sequence
  const sortBySequence = (a: NavigationMenuWithRelations, b: NavigationMenuWithRelations) => {
    if (a.sequence !== b.sequence) {
      return a.sequence - b.sequence
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  }

  roots.sort(sortBySequence)
  
  // Recursively sort children
  const sortChildren = (items: NavigationMenuWithRelations[]) => {
    items.sort(sortBySequence)
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        sortChildren(item.children)
      }
    })
  }

  sortChildren(roots)

  return roots
}

/**
 * Get all navigation menus with tree structure
 */
export async function getNavigationMenus() {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Fetch all menus
    const { data: menus, error } = await client
      .from('navigation_menus')
      .select('*')
      .order('sequence', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getNavigationMenus] Error fetching navigation menus:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Build tree structure
    const menuTree = buildMenuTree(menus || [])

    return {
      success: true,
      data: {
        menus: menus || [],
        tree: menuTree,
      },
    }
  } catch (error: any) {
    console.error('[getNavigationMenus] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get a single navigation menu by ID
 */
export async function getNavigationMenuById(menuId: string) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Fetch menu
    const { data: menu, error } = await client
      .from('navigation_menus')
      .select('*')
      .eq('id', menuId)
      .single()

    if (error) {
      console.error('[getNavigationMenuById] Error fetching navigation menu:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    if (!menu) {
      return {
        success: false,
        error: 'Navigation menu not found',
        data: null,
      }
    }

    return {
      success: true,
      data: menu as NavigationMenuWithRelations,
    }
  } catch (error: any) {
    console.error('[getNavigationMenuById] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

