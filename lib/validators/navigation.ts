/**
 * Navigation Validators
 * 
 * Zod schemas for validating navigation menu data
 */

import { z } from 'zod'

/**
 * Navigation menu create schema
 */
export const navigationMenuCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  url: z.string().max(500, 'URL is too long').optional().nullable(),
  menu_type: z.enum(['custom', 'journal', 'article', 'issue']).default('custom'),
  parent_id: z.string().uuid('Invalid parent ID').optional().nullable(),
  sequence: z.number().int().min(0, 'Sequence must be non-negative').default(0),
  enabled: z.boolean().default(true),
  target_blank: z.boolean().default(false),
  position: z.enum(['header', 'footer']).default('header'),
})

/**
 * Navigation menu update schema
 */
export const navigationMenuUpdateSchema = navigationMenuCreateSchema.partial().extend({
  id: z.string().uuid('Invalid menu ID'),
})

/**
 * Navigation menu reorder schema
 */
export const navigationMenuReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid('Invalid menu ID'),
    sequence: z.number().int().min(0, 'Sequence must be non-negative'),
  })).min(1, 'At least one item is required'),
})

export type NavigationMenuCreateInput = z.infer<typeof navigationMenuCreateSchema>
export type NavigationMenuUpdateInput = z.infer<typeof navigationMenuUpdateSchema>
export type NavigationMenuReorderInput = z.infer<typeof navigationMenuReorderSchema>



