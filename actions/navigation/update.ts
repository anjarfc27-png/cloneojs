/**
 * Navigation Server Actions - Update
 * 
 * Server Actions for updating navigation menus.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { navigationMenuUpdateSchema } from '@/lib/validators/navigation'

/**
 * Update a navigation menu item
 */
export async function updateNavigationMenu(values: z.infer<typeof navigationMenuUpdateSchema>) {
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

    // Validate input
    const data = navigationMenuUpdateSchema.parse(values)

    if (!data.id) {
      return {
        success: false,
        error: 'Menu ID is required',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get existing menu for audit log
    const { data: existingMenu } = await client
      .from('navigation_menus')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingMenu) {
      return {
        success: false,
        error: 'Navigation menu not found',
        data: null,
      }
    }

    // Prevent circular reference (menu cannot be its own parent or child)
    if (data.parent_id) {
      if (data.parent_id === data.id) {
        return {
          success: false,
          error: 'Menu cannot be its own parent',
          data: null,
        }
      }

      // Check if parent_id would create a circular reference
      let currentParentId = data.parent_id
      const visited = new Set<string>([data.id])

      while (currentParentId) {
        if (visited.has(currentParentId)) {
          return {
            success: false,
            error: 'Circular reference detected',
            data: null,
          }
        }
        visited.add(currentParentId)

        const { data: parentMenu } = await client
          .from('navigation_menus')
          .select('parent_id')
          .eq('id', currentParentId)
          .single()

        if (!parentMenu) break
        currentParentId = parentMenu.parent_id
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.title !== undefined) updateData.title = data.title
    if (data.url !== undefined) {
      updateData.url = data.url ? sanitizeHTML(data.url) : null
    }
    if (data.menu_type !== undefined) updateData.menu_type = data.menu_type
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id || null
    if (data.sequence !== undefined) updateData.sequence = data.sequence
    if (data.enabled !== undefined) updateData.enabled = data.enabled
    if (data.target_blank !== undefined) updateData.target_blank = data.target_blank

    // Update menu
    const { data: menu, error } = await client
      .from('navigation_menus')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateNavigationMenu] Error updating navigation menu:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('update_navigation_menu', {
      menu_id: menu.id,
      before: {
        name: existingMenu.name,
        title: existingMenu.title,
        enabled: existingMenu.enabled,
        parent_id: existingMenu.parent_id,
      },
      after: {
        name: menu.name,
        title: menu.title,
        enabled: menu.enabled,
        parent_id: menu.parent_id,
      },
    })

    // Revalidate paths
    revalidatePath('/admin/navigation')
    revalidatePath('/admin/dashboard')
    revalidatePath('/') // Home page navigation
    revalidatePath('/(.*)') // All pages (navigation affects all pages)

    return {
      success: true,
      data: menu,
    }
  } catch (error: any) {
    console.error('[updateNavigationMenu] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
        data: null,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

