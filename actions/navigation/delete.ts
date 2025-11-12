/**
 * Navigation Server Actions - Delete
 * 
 * Server Actions for deleting navigation menus.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { z } from 'zod'

const deleteNavigationMenuSchema = z.object({
  id: z.string().uuid('Invalid menu ID'),
})

/**
 * Delete a navigation menu item
 * This will also delete all child menu items (cascade delete)
 */
export async function deleteNavigationMenu(values: z.infer<typeof deleteNavigationMenuSchema>) {
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
    const data = deleteNavigationMenuSchema.parse(values)

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

    // Check if menu has children (cascade delete will handle this, but we log it)
    const { data: children } = await client
      .from('navigation_menus')
      .select('id')
      .eq('parent_id', data.id)

    // Delete menu (cascade delete will handle children)
    const { error } = await client
      .from('navigation_menus')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('[deleteNavigationMenu] Error deleting navigation menu:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('delete_navigation_menu', {
      menu_id: data.id,
      name: existingMenu.name,
      title: existingMenu.title,
      children_count: children?.length || 0,
    })

    // Revalidate paths
    revalidatePath('/admin/navigation')
    revalidatePath('/admin/dashboard')
    revalidatePath('/') // Home page navigation
    revalidatePath('/(.*)') // All pages (navigation affects all pages)

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error: any) {
    console.error('[deleteNavigationMenu] Unexpected error:', error)
    
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

