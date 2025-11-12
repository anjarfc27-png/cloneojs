/**
 * Announcements Server Actions - Get
 * 
 * Server Actions for retrieving announcements.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { ServerActionAuthOptions } from '@/lib/admin/types'

export interface GetAnnouncementsParams {
  page?: number
  limit?: number
  search?: string
  enabled?: boolean | null
}

export interface AnnouncementWithRelations {
  id: string
  title: string
  description: string | null
  short_description: string | null
  type: 'info' | 'warning' | 'success' | 'error'
  enabled: boolean
  date_posted: string
  date_expire: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

/**
 * Get all announcements with pagination and search
 */
export async function getAnnouncements(
  params: GetAnnouncementsParams = {},
  options: ServerActionAuthOptions = {}
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    const { page = 1, limit = 10, search = '', enabled = null } = params

    // Get admin client
    const client = createAdminClient()

    // Build query
    let query = client
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('date_posted', { ascending: false })

    // Apply enabled filter
    if (enabled !== null) {
      query = query.eq('enabled', enabled)
    }

    // Execute query
    const { data: announcements, error, count } = await query

    if (error) {
      console.error('[getAnnouncements] Error fetching announcements:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Get creator names (if needed)
    const creatorIds = [...new Set((announcements || []).map((a: any) => a.created_by).filter(Boolean))]
    const creatorsMap = new Map<string, string>()

    if (creatorIds.length > 0) {
      // Get users from auth (via admin API)
      const { data: usersList } = await client.auth.admin.listUsers()
      if (usersList?.users) {
        usersList.users.forEach((user: any) => {
          if (creatorIds.includes(user.id)) {
            const fullName = user.user_metadata?.full_name || 
              `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
              user.email
            creatorsMap.set(user.id, fullName)
          }
        })
      }
    }

    // Transform data
    let announcementsWithRelations: AnnouncementWithRelations[] = (announcements || []).map((announcement: any) => ({
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      short_description: announcement.short_description,
      type: announcement.type || 'info',
      enabled: announcement.enabled !== false,
      date_posted: announcement.date_posted || announcement.created_at,
      date_expire: announcement.date_expire,
      created_by: announcement.created_by,
      created_by_name: announcement.created_by ? creatorsMap.get(announcement.created_by) || null : null,
      created_at: announcement.created_at,
      updated_at: announcement.updated_at,
    }))

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      announcementsWithRelations = announcementsWithRelations.filter(
        (a) =>
          a.title?.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower) ||
          a.short_description?.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedAnnouncements = announcementsWithRelations.slice(start, end)

    return {
      success: true,
      data: {
        announcements: paginatedAnnouncements,
        total: search ? announcementsWithRelations.length : (count || 0),
        page,
        limit,
        totalPages: Math.ceil((search ? announcementsWithRelations.length : (count || 0)) / limit),
      },
    }
  } catch (error: any) {
    console.error('[getAnnouncements] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get a single announcement by ID
 */
export async function getAnnouncementById(
  announcementId: string,
  options: ServerActionAuthOptions = {}
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Fetch announcement
    const { data: announcement, error } = await client
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (error) {
      console.error('[getAnnouncementById] Error fetching announcement:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    if (!announcement) {
      return {
        success: false,
        error: 'Announcement not found',
        data: null,
      }
    }

    // Get creator name
    let createdByName = null
    if (announcement.created_by) {
      const { data: userData } = await client.auth.admin.getUserById(announcement.created_by)
      if (userData?.user) {
        const user = userData.user
        createdByName = user.user_metadata?.full_name || 
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
          user.email
      }
    }

    const announcementWithRelations: AnnouncementWithRelations = {
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      short_description: announcement.short_description,
      type: announcement.type || 'info',
      enabled: announcement.enabled !== false,
      date_posted: announcement.date_posted || announcement.created_at,
      date_expire: announcement.date_expire,
      created_by: announcement.created_by,
      created_by_name: createdByName,
      created_at: announcement.created_at,
      updated_at: announcement.updated_at,
    }

    return {
      success: true,
      data: announcementWithRelations,
    }
  } catch (error: any) {
    console.error('[getAnnouncementById] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

