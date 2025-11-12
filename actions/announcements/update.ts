/**
 * Announcements Server Actions - Update
 * 
 * Server Actions for updating announcements.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { announcementUpdateSchema, announcementStatusSchema } from '@/lib/validators/announcements'

/**
 * Update an announcement
 */
export async function updateAnnouncement(values: z.infer<typeof announcementUpdateSchema>) {
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
    const data = announcementUpdateSchema.parse(values)

    if (!data.id) {
      return {
        success: false,
        error: 'Announcement ID is required',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get existing announcement for audit log
    const { data: existingAnnouncement } = await client
      .from('announcements')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingAnnouncement) {
      return {
        success: false,
        error: 'Announcement not found',
        data: null,
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) {
      updateData.description = data.description ? sanitizeHTML(data.description) : null
    }
    if (data.short_description !== undefined) {
      updateData.short_description = data.short_description ? sanitizeHTML(data.short_description) : null
    }
    if (data.type !== undefined) updateData.type = data.type
    if (data.enabled !== undefined) updateData.enabled = data.enabled
    if (data.date_posted !== undefined) {
      updateData.date_posted = data.date_posted ? new Date(data.date_posted).toISOString() : new Date().toISOString()
    }
    if (data.date_expire !== undefined) {
      updateData.date_expire = data.date_expire ? new Date(data.date_expire).toISOString() : null
    }

    // Update announcement
    const { data: announcement, error } = await client
      .from('announcements')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateAnnouncement] Error updating announcement:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('update_announcement', {
      announcement_id: announcement.id,
      before: {
        title: existingAnnouncement.title,
        enabled: existingAnnouncement.enabled,
        type: existingAnnouncement.type,
      },
      after: {
        title: announcement.title,
        enabled: announcement.enabled,
        type: announcement.type,
      },
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
    console.error('[updateAnnouncement] Unexpected error:', error)
    
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

/**
 * Update announcement status (enabled/disabled)
 */
export async function updateAnnouncementStatus(values: z.infer<typeof announcementStatusSchema>) {
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
    const data = announcementStatusSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing announcement
    const { data: existingAnnouncement } = await client
      .from('announcements')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingAnnouncement) {
      return {
        success: false,
        error: 'Announcement not found',
        data: null,
      }
    }

    // Update status
    const { data: announcement, error } = await client
      .from('announcements')
      .update({
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateAnnouncementStatus] Error updating announcement status:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('update_announcement_status', {
      announcement_id: announcement.id,
      before: {
        enabled: existingAnnouncement.enabled,
      },
      after: {
        enabled: data.enabled,
      },
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
    console.error('[updateAnnouncementStatus] Unexpected error:', error)
    
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

