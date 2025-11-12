/**
 * Navigation Server Actions - Create
 * 
 * Server Actions for creating navigation menus.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { navigationMenuCreateSchema } from '@/lib/validators/navigation'

/**
 * Create a new navigation menu item
 */
export async function createNavigationMenu(values: z.infer<typeof navigationMenuCreateSchema>) {
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
    const data = navigationMenuCreateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Validate parent_id if provided
    if (data.parent_id) {
      const { data: parentMenu } = await client
        .from('navigation_menus')
        .select('id')
        .eq('id', data.parent_id)
        .single()

      if (!parentMenu) {
        return {
          success: false,
          error: 'Parent menu not found',
          data: null,
        }
      }
    }

    // Get max sequence for this level (same parent_id or null)
    const { data: maxSequenceData } = await client
      .from('navigation_menus')
      .select('sequence')
      .eq('parent_id', data.parent_id || null)
      .order('sequence', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextSequence = maxSequenceData?.sequence !== undefined
      ? maxSequenceData.sequence + 1
      : (data.sequence || 0)

    // Sanitize URL if provided
    const sanitizedUrl = data.url ? sanitizeHTML(data.url) : null

    // Create navigation menu
    const { data: menu, error } = await client
      .from('navigation_menus')
      .insert({
        name: data.name,
        title: data.title,
        url: sanitizedUrl,
        menu_type: data.menu_type || 'custom',
        parent_id: data.parent_id || null,
        sequence: nextSequence,
        enabled: data.enabled !== false,
        target_blank: data.target_blank || false,
      })
      .select()
      .single()

    if (error) {
      console.error('[createNavigationMenu] Error creating navigation menu:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('create_navigation_menu', {
      menu_id: menu.id,
      name: menu.name,
      title: menu.title,
      parent_id: menu.parent_id,
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
    console.error('[createNavigationMenu] Unexpected error:', error)
    
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

