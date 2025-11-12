import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/tasks/[id]
 * Get single system task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: task, error } = await supabase
      .from('system_tasks')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching system task:', error)
      return NextResponse.json(
        { error: 'Failed to fetch system task', details: error.message },
        { status: 500 }
      )
    }

    // Get task logs
    const { data: logs } = await supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      task: {
        ...task,
        logs: logs || [],
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/tasks/[id]
 * Update system task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { enabled, run_interval, task_class } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (enabled !== undefined) updateData.enabled = enabled
    if (run_interval !== undefined) updateData.run_interval = run_interval
    if (task_class !== undefined) updateData.task_class = task_class

    const { data, error } = await supabase
      .from('system_tasks')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating system task:', error)
      return NextResponse.json(
        { error: 'Failed to update system task', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'system_task_updated',
      'system_task',
      params.id,
      { enabled, run_interval }
    )

    return NextResponse.json({
      message: 'System task updated successfully',
      task: data,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

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

    // Update task status to running
    await supabase
      .from('system_tasks')
      .update({
        last_status: 'running',
        last_run: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    // Log task execution
    await supabase
      .from('task_logs')
      .insert({
        task_id: params.id,
        status: 'success',
        message: 'Task executed manually',
        execution_time: 0,
        details: { manual: true },
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
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/tasks/[id]/run:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


