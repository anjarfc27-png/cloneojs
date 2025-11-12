/**
 * Users Server Actions - Create
 * 
 * Server Actions for creating users.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logUserAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { userCreateSchema } from '@/lib/validators/users'

/**
 * Create a new user
 */
export async function createUser(values: z.infer<typeof userCreateSchema>) {
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
    const data = userCreateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await client.auth.admin.listUsers()
    const userExists = existingUser?.users.some((u: any) => u.email === data.email)

    if (userExists) {
      return {
        success: false,
        error: 'User with this email already exists',
        data: null,
      }
    }

    // Get role ID
    const { data: roleData, error: roleError } = await client
      .from('roles')
      .select('id')
      .eq('role_key', data.role)
      .single()

    if (roleError || !roleData) {
      return {
        success: false,
        error: `Role ${data.role} not found`,
        data: null,
      }
    }

    // Get default tenant (for backward compatibility)
    const { data: defaultTenant } = await client
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .single()

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await client.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: data.full_name,
        first_name: data.full_name.split(' ')[0] || data.full_name,
        last_name: data.full_name.split(' ').slice(1).join(' ') || '',
      },
    })

    if (authError) {
      console.error('[createUser] Error creating user:', authError)
      return {
        success: false,
        error: authError.message,
        data: null,
      }
    }

    if (!authUser?.user) {
      return {
        success: false,
        error: 'Failed to create user',
        data: null,
      }
    }

    const userId = authUser.user.id

    // Assign role
    const roleAssignment: any = {
      user_id: userId,
      role_id: roleData.id,
      is_active: data.is_active !== false,
    }

    // Add journal_id if provided
    if (data.journal_id) {
      roleAssignment.journal_id = data.journal_id
    }

    // Add tenant_id if provided or use default
    if (defaultTenant) {
      roleAssignment.tenant_id = defaultTenant.id
    }

    // Create role assignment
    const { error: assignmentError } = await client
      .from('user_role_assignments')
      .insert(roleAssignment)

    if (assignmentError) {
      console.error('[createUser] Error creating role assignment:', assignmentError)
      // Don't fail if role assignment fails, but log it
    }

    // Also create legacy tenant_users entry for backward compatibility
    if (defaultTenant) {
      await client
        .from('tenant_users')
        .insert({
          user_id: userId,
          tenant_id: defaultTenant.id,
          role: data.role,
          is_active: data.is_active !== false,
        })
        .then(() => {
          // Ignore errors if it already exists
        })
        .catch(() => {
          // Ignore errors
        })
    }

    // Log audit event
    await logUserAction('create_user', userId, {
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      journal_id: data.journal_id,
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        id: userId,
        email: data.email,
        full_name: data.full_name,
      },
    }
  } catch (error: any) {
    console.error('[createUser] Unexpected error:', error)
    
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

