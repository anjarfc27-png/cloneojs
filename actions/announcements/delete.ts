/**
 * Announcements Server Actions - Delete
 * 
 * Server Actions for deleting announcements.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { z } from 'zod'

const deleteAnnouncementSchema = z.object({
  id: z.string().uuid('Invalid announcement ID'),
})

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(values: z.infer<typeof deleteAnnouncementSchema>) {
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
    const data = deleteAnnouncementSchema.parse(values)

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

    // Delete announcement
    const { error } = await client
      .from('announcements')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('[deleteAnnouncement] Error deleting announcement:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('delete_announcement', {
      announcement_id: data.id,
      title: existingAnnouncement.title,
      type: existingAnnouncement.type,
    })

    // Revalidate paths
    revalidatePath('/admin/announcements')
    revalidatePath('/admin/dashboard')
    revalidatePath('/') // Home page might show announcements

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error: any) {
    console.error('[deleteAnnouncement] Unexpected error:', error)
    
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

