/**
 * Announcements Validators
 * 
 * Zod schemas for validating announcement data
 */

import { z } from 'zod'

/**
 * Announcement create schema
 */
export const announcementCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional().nullable(),
  short_description: z.string().max(500, 'Short description is too long').optional().nullable(),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  enabled: z.boolean().default(true),
  date_posted: z.string().datetime().optional().nullable(),
  date_expire: z.string().datetime().optional().nullable(),
  target: z.enum(['all', 'subset']).default('all'),
  journal_ids: z.array(z.string().uuid('Invalid journal ID')).optional().nullable(),
})

/**
 * Announcement update schema
 */
export const announcementUpdateSchema = announcementCreateSchema.partial().extend({
  id: z.string().uuid('Invalid announcement ID'),
})

/**
 * Announcement status schema
 */
export const announcementStatusSchema = z.object({
  id: z.string().uuid('Invalid announcement ID'),
  enabled: z.boolean(),
})

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>
export type AnnouncementStatusInput = z.infer<typeof announcementStatusSchema>



