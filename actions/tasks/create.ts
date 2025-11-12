/**
 * Tasks Server Actions - Create
 * 
 * Server Actions for creating system tasks.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { taskCreateSchema } from '@/lib/validators/tasks'
import { revalidatePath } from 'next/cache'

/**
 * Create a new system task
 */
export async function createTask(values: {
  task_name: string
  task_class: string
  enabled?: boolean
  run_interval?: number
}) {
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
    const validatedData = taskCreateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Create task
    const { data: newTask, error } = await client
      .from('system_tasks')
      .insert({
        task_name: validatedData.task_name,
        task_class: validatedData.task_class,
        enabled: validatedData.enabled,
        run_interval: validatedData.run_interval,
        last_status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[createTask] Error creating task:', error)
      return {
        success: false,
        error: error.message || 'Failed to create system task',
        data: null,
      }
    }

    // Log activity
    await auditLog({
      action: 'system_task_created',
      entity_type: 'system_task',
      entity_id: newTask.id,
      details: {
        task_name: validatedData.task_name,
        task_class: validatedData.task_class,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/tasks')

    return {
      success: true,
      data: newTask,
    }
  } catch (error: any) {
    console.error('[createTask] Unexpected error:', error)
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

