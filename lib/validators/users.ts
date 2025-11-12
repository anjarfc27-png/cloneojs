/**
 * Users Validators
 * 
 * Zod schemas for validating user data
 */

import { z } from 'zod'

/**
 * User create schema
 */
export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required').max(255, 'Full name is too long'),
  role: z.enum([
    'super_admin',
    'site_admin',
    'journal_manager',
    'editor',
    'section_editor',
    'reviewer',
    'author',
    'reader',
    'copyeditor',
    'proofreader',
    'production_editor',
  ]),
  journal_id: z.string().uuid('Invalid journal ID').optional().nullable(),
  is_active: z.boolean().default(true),
})

/**
 * User update schema
 */
export const userUpdateSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address').optional(),
  full_name: z.string().min(1, 'Full name is required').max(255, 'Full name is too long').optional(),
  is_active: z.boolean().optional(),
})

/**
 * User role assignment schema
 */
export const userRoleAssignmentSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum([
    'super_admin',
    'site_admin',
    'journal_manager',
    'editor',
    'section_editor',
    'reviewer',
    'author',
    'reader',
    'copyeditor',
    'proofreader',
    'production_editor',
  ]),
  journal_id: z.string().uuid('Invalid journal ID').optional().nullable(),
})

/**
 * User role revocation schema
 */
export const userRoleRevocationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum([
    'super_admin',
    'site_admin',
    'journal_manager',
    'editor',
    'section_editor',
    'reviewer',
    'author',
    'reader',
    'copyeditor',
    'proofreader',
    'production_editor',
  ]),
  journal_id: z.string().uuid('Invalid journal ID').optional().nullable(),
})

/**
 * User merge schema
 */
export const userMergeSchema = z.object({
  from_user_id: z.string().uuid('Invalid user ID'),
  to_user_id: z.string().uuid('Invalid user ID'),
})

/**
 * User password reset schema
 */
export const userPasswordResetSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type UserRoleAssignmentInput = z.infer<typeof userRoleAssignmentSchema>
export type UserRoleRevocationInput = z.infer<typeof userRoleRevocationSchema>
export type UserMergeInput = z.infer<typeof userMergeSchema>
export type UserPasswordResetInput = z.infer<typeof userPasswordResetSchema>



