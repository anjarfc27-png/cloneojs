/**
 * Tasks Server Actions - Run
 * 
 * Server Actions for manually running system tasks.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'

/**
 * Manually run a system task
 */
export async function runTask(id: string) {
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

    // Get admin client
    const client = createAdminClient()

    // Get task
    const { data: task, error: taskError } = await client
      .from('system_tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (taskError || !task) {
      return {
        success: false,
        error: 'Task not found',
        data: null,
      }
    }

    const startTime = Date.now()

    // Update task status to running
    await client
      .from('system_tasks')
      .update({
        last_status: 'running',
        last_run: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    try {
      // Execute task based on task_class
      // Note: In a real implementation, you would have task handlers
      // For now, we'll just simulate task execution
      await new Promise(resolve => setTimeout(resolve, 100))

      const executionTime = Date.now() - startTime

      // Log task execution
      await client
        .from('task_logs')
        .insert({
          task_id: id,
          status: 'success',
          message: 'Task executed manually',
          execution_time: executionTime,
          details: { manual: true, task_class: task.task_class },
        })

      // Update task status to success
      await client
        .from('system_tasks')
        .update({
          last_status: 'success',
          last_message: 'Task executed successfully',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      // Log activity
      await auditLog({
        action: 'system_task_executed',
        entity_type: 'system_task',
        entity_id: id,
        details: {
          task_name: task.task_name,
          execution_time,
        },
        user_id: authCheck.user.id,
      })

      revalidatePath('/admin/tasks')

      return {
        success: true,
        data: {
          execution_time,
          message: 'Task executed successfully',
        },
      }
    } catch (taskError: any) {
      const executionTime = Date.now() - startTime

      // Log task error
      await client
        .from('task_logs')
        .insert({
          task_id: id,
          status: 'error',
          message: taskError.message || 'Task execution failed',
          execution_time: executionTime,
          details: { manual: true, error: taskError.message },
        })

      // Update task status to error
      await client
        .from('system_tasks')
        .update({
          last_status: 'error',
          last_message: taskError.message || 'Task execution failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      return {
        success: false,
        error: taskError.message || 'Task execution failed',
        data: null,
      }
    }
  } catch (error: any) {
    console.error('[runTask] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

