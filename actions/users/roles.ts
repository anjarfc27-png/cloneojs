/**
 * Users Server Actions - Roles
 * 
 * Server Actions for managing user role assignments.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logUserAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { userRoleAssignmentSchema, userRoleRevocationSchema } from '@/lib/validators/users'

/**
 * Assign a role to a user
 */
export async function assignUserRole(values: z.infer<typeof userRoleAssignmentSchema>) {
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
    const data = userRoleAssignmentSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

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

    // Check if assignment already exists
    const assignmentQuery: any = {
      user_id: data.user_id,
      role_id: roleData.id,
    }

    if (data.journal_id) {
      assignmentQuery.journal_id = data.journal_id
    }

    if (defaultTenant) {
      assignmentQuery.tenant_id = defaultTenant.id
    }

    const { data: existingAssignment } = await client
      .from('user_role_assignments')
      .select('id')
      .match(assignmentQuery)
      .maybeSingle()

    if (existingAssignment) {
      // Update existing assignment to active
      const { error: updateError } = await client
        .from('user_role_assignments')
        .update({ is_active: true })
        .eq('id', existingAssignment.id)

      if (updateError) {
        console.error('[assignUserRole] Error updating role assignment:', updateError)
        return {
          success: false,
          error: updateError.message,
          data: null,
        }
      }
    } else {
      // Create new assignment
      const { error: insertError } = await client
        .from('user_role_assignments')
        .insert({
          user_id: data.user_id,
          role_id: roleData.id,
          journal_id: data.journal_id || null,
          tenant_id: defaultTenant?.id || null,
          is_active: true,
        })

      if (insertError) {
        console.error('[assignUserRole] Error creating role assignment:', insertError)
        return {
          success: false,
          error: insertError.message,
          data: null,
        }
      }
    }

    // Also update legacy tenant_users for backward compatibility
    if (defaultTenant) {
      await client
        .from('tenant_users')
        .upsert({
          user_id: data.user_id,
          tenant_id: defaultTenant.id,
          role: data.role,
          is_active: true,
        }, {
          onConflict: 'user_id,tenant_id',
        })
        .then(() => {
          // Ignore errors
        })
        .catch(() => {
          // Ignore errors
        })
    }

    // Log audit event
    await logUserAction('assign_user_role', data.user_id, {
      role: data.role,
      journal_id: data.journal_id,
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        user_id: data.user_id,
        role: data.role,
      },
    }
  } catch (error: any) {
    console.error('[assignUserRole] Unexpected error:', error)
    
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
 * Revoke a role from a user
 */
export async function revokeUserRole(values: z.infer<typeof userRoleRevocationSchema>) {
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
    const data = userRoleRevocationSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

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

    // Get default tenant
    const { data: defaultTenant } = await client
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .single()

    // Build query to find assignment
    const assignmentQuery: any = {
      user_id: data.user_id,
      role_id: roleData.id,
    }

    if (data.journal_id) {
      assignmentQuery.journal_id = data.journal_id
    }

    if (defaultTenant) {
      assignmentQuery.tenant_id = defaultTenant.id
    }

    // Deactivate role assignment (soft delete)
    const { error: updateError } = await client
      .from('user_role_assignments')
      .update({ is_active: false })
      .match(assignmentQuery)

    if (updateError) {
      console.error('[revokeUserRole] Error revoking role assignment:', updateError)
      return {
        success: false,
        error: updateError.message,
        data: null,
      }
    }

    // Also update legacy tenant_users for backward compatibility
    if (defaultTenant) {
      await client
        .from('tenant_users')
        .update({ is_active: false })
        .eq('user_id', data.user_id)
        .eq('tenant_id', defaultTenant.id)
        .eq('role', data.role)
        .then(() => {
          // Ignore errors
        })
        .catch(() => {
          // Ignore errors
        })
    }

    // Log audit event
    await logUserAction('revoke_user_role', data.user_id, {
      role: data.role,
      journal_id: data.journal_id,
    })

    // Revalidate paths
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        user_id: data.user_id,
        role: data.role,
      },
    }
  } catch (error: any) {
    console.error('[revokeUserRole] Unexpected error:', error)
    
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

