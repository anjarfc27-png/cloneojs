/**
 * Navigation Server Actions - Reorder
 * 
 * Server Actions for reordering navigation menus.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { navigationMenuReorderSchema } from '@/lib/validators/navigation'

/**
 * Reorder navigation menu items
 */
export async function reorderNavigationMenus(values: { items: Array<{ id: string; sequence: number }> }) {
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
    const data = navigationMenuReorderSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Update sequences for all items
    const updates = data.items.map((item) =>
      client
        .from('navigation_menus')
        .update({ sequence: item.sequence, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    )

    // Execute all updates
    const results = await Promise.all(updates)
    
    // Check for errors
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      console.error('[reorderNavigationMenus] Error reordering menus:', errors)
      return {
        success: false,
        error: 'Failed to reorder some menu items',
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('reorder_navigation_menus', {
      items_count: data.items.length,
      items: data.items.map((item) => ({
        id: item.id,
        sequence: item.sequence,
      })),
    })

    // Revalidate paths
    revalidatePath('/admin/navigation')
    revalidatePath('/admin/dashboard')
    revalidatePath('/') // Home page navigation
    revalidatePath('/(.*)') // All pages (navigation affects all pages)

    return {
      success: true,
      data: { updated: data.items.length },
    }
  } catch (error: any) {
    console.error('[reorderNavigationMenus] Unexpected error:', error)
    
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

