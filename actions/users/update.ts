/**
 * Users Server Actions - Update
 * 
 * Server Actions for updating users.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logUserAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { userUpdateSchema, userPasswordResetSchema } from '@/lib/validators/users'

/**
 * Update a user
 */
export async function updateUser(values: z.infer<typeof userUpdateSchema>) {
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
    const data = userUpdateSchema.parse(values)

    if (!data.id) {
      return {
        success: false,
        error: 'User ID is required',
        data: null,
      }
    }

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

    // Prepare update data
    const updateData: any = {}

    if (data.email !== undefined && data.email !== existingUser.email) {
      updateData.email = data.email
    }

    if (data.full_name !== undefined) {
      const userMetadata = existingUser.user_metadata || {}
      updateData.user_metadata = {
        ...userMetadata,
        full_name: data.full_name,
        first_name: data.full_name.split(' ')[0] || data.full_name,
        last_name: data.full_name.split(' ').slice(1).join(' ') || '',
      }
    }

    // Handle is_active (ban/unban user)
    if (data.is_active !== undefined) {
      if (data.is_active) {
        updateData.ban_duration = 'none' // Unban user
      } else {
        // Ban user (set ban_duration to a far future date)
        updateData.ban_duration = '87600h' // ~10 years
      }
    }

    // Update user in Supabase Auth
    const { data: updatedUserData, error: updateError } = await client.auth.admin.updateUserById(
      data.id,
      updateData
    )

    if (updateError) {
      console.error('[updateUser] Error updating user:', updateError)
      return {
        success: false,
        error: updateError.message,
        data: null,
      }
    }

    if (!updatedUserData?.user) {
      return {
        success: false,
        error: 'Failed to update user',
        data: null,
      }
    }

    // Log audit event
    await logUserAction('update_user', data.id, {
      before: {
        email: existingUser.email,
        full_name: existingUser.user_metadata?.full_name,
        is_active: existingUser.banned_until === null,
      },
      after: {
        email: updatedUserData.user.email,
        full_name: updatedUserData.user.user_metadata?.full_name,
        is_active: updatedUserData.user.banned_until === null,
      },
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        id: updatedUserData.user.id,
        email: updatedUserData.user.email,
        full_name: updatedUserData.user.user_metadata?.full_name,
        is_active: updatedUserData.user.banned_until === null,
      },
    }
  } catch (error: any) {
    console.error('[updateUser] Unexpected error:', error)
    
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
 * Reset user password
 */
export async function resetUserPassword(values: z.infer<typeof userPasswordResetSchema>) {
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
    const data = userPasswordResetSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Update user password
    const { data: updatedUserData, error: updateError } = await client.auth.admin.updateUserById(
      data.user_id,
      {
        password: data.new_password,
      }
    )

    if (updateError) {
      console.error('[resetUserPassword] Error resetting password:', updateError)
      return {
        success: false,
        error: updateError.message,
        data: null,
      }
    }

    // Log audit event
    await logUserAction('reset_user_password', data.user_id, {
      user_id: data.user_id,
    })

    // Revalidate paths
    revalidatePath('/admin/users')

    return {
      success: true,
      data: {
        id: data.user_id,
      },
    }
  } catch (error: any) {
    console.error('[resetUserPassword] Unexpected error:', error)
    
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

