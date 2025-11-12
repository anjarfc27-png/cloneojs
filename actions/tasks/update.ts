/**
 * Tasks Server Actions - Update
 * 
 * Server Actions for updating system tasks.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { taskUpdateSchema } from '@/lib/validators/tasks'
import { revalidatePath } from 'next/cache'

/**
 * Update a system task
 */
export async function updateTask(
  id: string,
  values: {
    enabled?: boolean
    run_interval?: number
    task_class?: string
  }
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const validatedData = taskUpdateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.enabled !== undefined) {
      updateData.enabled = validatedData.enabled
    }
    if (validatedData.run_interval !== undefined) {
      updateData.run_interval = validatedData.run_interval
    }
    if (validatedData.task_class !== undefined) {
      updateData.task_class = validatedData.task_class
    }

    // Update task
    const { data: updatedTask, error } = await client
      .from('system_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[updateTask] Error updating task:', error)
      return {
        success: false,
        error: error.message || 'Failed to update system task',
        data: null,
      }
    }

    // Log activity
    await auditLog({
      action: 'system_task_updated',
      entity_type: 'system_task',
      entity_id: id,
      details: {
        changes: validatedData,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/tasks')

    return {
      success: true,
      data: updatedTask,
    }
  } catch (error: any) {
    console.error('[updateTask] Unexpected error:', error)
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error',
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

