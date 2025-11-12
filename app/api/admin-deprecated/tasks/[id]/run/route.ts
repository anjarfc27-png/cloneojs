import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * POST /api/admin/tasks/[id]/run
 * Manually run a system task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('system_tasks')
      .select('*')
      .eq('id', params.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found', details: taskError?.message },
        { status: 404 }
      )
    }

    const startTime = Date.now()

    // Update task status to running
    await supabase
      .from('system_tasks')
      .update({
        last_status: 'running',
        last_run: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    try {
      // Execute task based on task_class
      // Note: In a real implementation, you would have task handlers
      // For now, we'll just simulate task execution
      await new Promise(resolve => setTimeout(resolve, 100))

      const executionTime = Date.now() - startTime

      // Log task execution
      await supabase
        .from('task_logs')
        .insert({
          task_id: params.id,
          status: 'success',
          message: 'Task executed manually',
          execution_time: executionTime,
          details: { manual: true, task_class: task.task_class },
        })

      // Update task status to success
      await supabase
        .from('system_tasks')
        .update({
          last_status: 'success',
          last_message: 'Task executed successfully',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      // Log activity
      await logActivity(
        'system_task_executed',
        'system_task',
        params.id,
        { task_name: task.task_name }
      )

      return NextResponse.json({
        message: 'Task executed successfully',
        execution_time: executionTime,
      })
    } catch (taskError: any) {
      const executionTime = Date.now() - startTime

      // Log task error
      await supabase
        .from('task_logs')
        .insert({
          task_id: params.id,
          status: 'error',
          message: taskError.message || 'Task execution failed',
          execution_time: executionTime,
          details: { manual: true, error: taskError.message },
        })

      // Update task status to error
      await supabase
        .from('system_tasks')
        .update({
          last_status: 'error',
          last_message: taskError.message || 'Task execution failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      return NextResponse.json(
        { error: 'Task execution failed', details: taskError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in POST /api/admin/tasks/[id]/run:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


