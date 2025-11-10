/**
 * Validation Schemas untuk Users
 */

import { z } from 'zod'

/**
 * Schema untuk create user
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters'),
  role: z.enum(
    ['super_admin', 'editor', 'section_editor', 'reviewer', 'author', 'reader'],
    {
      errorMap: () => ({ message: 'Invalid role' }),
    }
  ),
  tenant_id: z.string().uuid('Invalid tenant ID format').optional().nullable(),
  is_active: z.boolean().default(true),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

/**
 * Schema untuk update user
 */
export const updateUserSchema = createUserSchema
  .partial()
  .extend({
    id: z.string().uuid('Invalid user ID format'),
  })
  .omit({ password: true }) // Password update handled separately

export type UpdateUserInput = z.infer<typeof updateUserSchema>

/**
 * Schema untuk login
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

