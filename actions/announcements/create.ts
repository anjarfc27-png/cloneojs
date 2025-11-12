/**
 * Announcements Server Actions - Create
 * 
 * Server Actions for creating announcements.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { logSettingsAction } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { announcementCreateSchema } from '@/lib/validators/announcements'
import { ServerActionAuthOptions } from '@/lib/admin/types'

/**
 * Create a new announcement
 */
export async function createAnnouncement(
  values: z.infer<typeof announcementCreateSchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const data = announcementCreateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get current user from authCheck
    const user = authCheck.user

    // Sanitize HTML fields
    const sanitizedDescription = data.description ? sanitizeHTML(data.description) : null
    const sanitizedShortDescription = data.short_description ? sanitizeHTML(data.short_description) : null

    // Prepare date_posted
    const datePosted = data.date_posted ? new Date(data.date_posted) : new Date()
    const dateExpire = data.date_expire ? new Date(data.date_expire) : null

    // Create announcement
    const { data: announcement, error } = await client
      .from('announcements')
      .insert({
        title: data.title,
        description: sanitizedDescription,
        short_description: sanitizedShortDescription,
        type: data.type || 'info',
        enabled: data.enabled !== false,
        date_posted: datePosted.toISOString(),
        date_expire: dateExpire?.toISOString() || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[createAnnouncement] Error creating announcement:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('create_announcement', {
      announcement_id: announcement.id,
      title: announcement.title,
      type: announcement.type,
    })

    // Revalidate paths
    revalidatePath('/admin/announcements')
    revalidatePath('/admin/dashboard')
    revalidatePath('/') // Home page might show announcements

    return {
      success: true,
      data: announcement,
    }
  } catch (error: any) {
    console.error('[createAnnouncement] Unexpected error:', error)
    
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

