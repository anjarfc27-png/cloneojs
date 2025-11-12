/**
 * Users Server Actions - Delete
 * 
 * Server Actions for deleting users.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logUserAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { z } from 'zod'
import { ServerActionAuthOptions } from '@/lib/admin/types'

const deleteUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
})

/**
 * Delete a user (soft delete - ban user)
 */
export async function deleteUser(
  values: z.infer<typeof deleteUserSchema>,
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

    // Validate input
    const data = deleteUserSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing user for audit log
    const { data: existingUserData } = await client.auth.admin.getUserById(data.id)
    const existingUser = existingUserData?.user

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      }
    }

    // Soft delete: Ban user and deactivate role assignments
    const { error: banError } = await client.auth.admin.updateUserById(data.id, {
      ban_duration: '87600h', // ~10 years (effectively permanent ban)
    })

    if (banError) {
      console.error('[deleteUser] Error banning user:', banError)
      return {
        success: false,
        error: banError.message,
        data: null,
      }
    }

    // Deactivate all role assignments
    await client
      .from('user_role_assignments')
      .update({ is_active: false })
      .eq('user_id', data.id)
      .then(() => {
        // Ignore errors
      })
      .catch(() => {
        // Ignore errors
      })

    // Also deactivate legacy tenant_users
    await client
      .from('tenant_users')
      .update({ is_active: false })
      .eq('user_id', data.id)
      .then(() => {
        // Ignore errors
      })
      .catch(() => {
        // Ignore errors
      })

    // Log audit event
    await logUserAction('delete_user', data.id, {
      email: existingUser.email,
      full_name: existingUser.user_metadata?.full_name,
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error: any) {
    console.error('[deleteUser] Unexpected error:', error)
    
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
 * Hard delete a user (permanent deletion)
 * WARNING: This will permanently delete the user and all related data.
 * Use with caution.
 */
export async function hardDeleteUser(
  values: z.infer<typeof deleteUserSchema>,
  options: ServerActionAuthOptions = {},
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

    // Validate input
    const data = deleteUserSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing user for audit log
    const { data: existingUserData } = await client.auth.admin.getUserById(data.id)
    const existingUser = existingUserData?.user

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      }
    }

    // Log audit event before deletion
    await logUserAction('hard_delete_user', data.id, {
      email: existingUser.email,
      full_name: existingUser.user_metadata?.full_name,
    })

    // Hard delete: Actually delete user from Supabase Auth
    // Note: This will cascade delete related records if foreign keys are set up correctly
    const { error: deleteError } = await client.auth.admin.deleteUser(data.id)

    if (deleteError) {
      console.error('[hardDeleteUser] Error deleting user:', deleteError)
      return {
        success: false,
        error: deleteError.message,
        data: null,
      }
    }

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error: any) {
    console.error('[hardDeleteUser] Unexpected error:', error)
    
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

