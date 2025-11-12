/**
 * Tasks Server Actions - Get
 * 
 * Server Actions for retrieving system tasks.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'

export interface TaskLog {
  id: string
  task_id: string
  status: string
  message?: string | null
  execution_time?: number | null
  details?: any
  created_at: string
}

export interface SystemTask {
  id: string
  task_name: string
  task_class: string
  enabled: boolean
  last_run?: string | null
  next_run?: string | null
  run_interval: number
  last_status?: string | null
  last_message?: string | null
  created_at: string
  updated_at: string
  logs?: TaskLog[]
}

/**
 * Get all system tasks
 */
export async function getTasks(params: {
  include_logs?: boolean
} = {}) {
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

    // Get admin client
    const client = createAdminClient()

    // Get all tasks
    const { data: tasks, error } = await client
      .from('system_tasks')
      .select('*')
      .order('task_name', { ascending: true })

    if (error) {
      console.error('[getTasks] Error fetching tasks:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch system tasks',
        data: null,
      }
    }

    // Get task logs if requested
    if (params.include_logs && tasks && tasks.length > 0) {
      const taskIds = tasks.map((t: any) => t.id)
      const { data: logs } = await client
        .from('task_logs')
        .select('*')
        .in('task_id', taskIds)
        .order('created_at', { ascending: false })
        .limit(100)

      // Group logs by task_id
      const logsByTask = new Map<string, TaskLog[]>()
      logs?.forEach((log: any) => {
        if (!logsByTask.has(log.task_id)) {
          logsByTask.set(log.task_id, [])
        }
        logsByTask.get(log.task_id)!.push(log)
      })

      // Add logs to tasks
      tasks.forEach((task: any) => {
        task.logs = logsByTask.get(task.id) || []
      })
    }

    return {
      success: true,
      data: tasks as SystemTask[],
    }
  } catch (error: any) {
    console.error('[getTasks] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get single task by ID
 */
export async function getTaskById(id: string, includeLogs: boolean = false) {
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

    // Get admin client
    const client = createAdminClient()

    // Get task
    const { data: task, error } = await client
      .from('system_tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[getTaskById] Error fetching task:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch system task',
        data: null,
      }
    }

    // Get task logs if requested
    if (includeLogs) {
      const { data: logs } = await client
        .from('task_logs')
        .select('*')
        .eq('task_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      return {
        success: true,
        data: {
          ...task,
          logs: logs || [],
        } as SystemTask,
      }
    }

    return {
      success: true,
      data: task as SystemTask,
    }
  } catch (error: any) {
    console.error('[getTaskById] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

