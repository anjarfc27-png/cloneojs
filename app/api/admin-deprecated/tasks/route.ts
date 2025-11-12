import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/tasks
 * Get all system tasks
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const includeLogs = searchParams.get('include_logs') === 'true'

    const { data: tasks, error } = await supabase
      .from('system_tasks')
      .select('*')
      .order('task_name', { ascending: true })

    if (error) {
      console.error('Error fetching system tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch system tasks', details: error.message },
        { status: 500 }
      )
    }

    // Get task logs if requested
    if (includeLogs && tasks && tasks.length > 0) {
      const taskIds = tasks.map(t => t.id)
      const { data: logs } = await supabase
        .from('task_logs')
        .select('*')
        .in('task_id', taskIds)
        .order('created_at', { ascending: false })
        .limit(100)

      // Group logs by task_id
      const logsByTask = new Map()
      logs?.forEach(log => {
        if (!logsByTask.has(log.task_id)) {
          logsByTask.set(log.task_id, [])
        }
        logsByTask.get(log.task_id).push(log)
      })

      // Add logs to tasks
      tasks.forEach(task => {
        task.logs = logsByTask.get(task.id) || []
      })
    }

    return NextResponse.json({
      tasks: tasks || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/tasks
 * Create new system task
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { task_name, task_class, enabled, run_interval } = body

    if (!task_name || !task_class) {
      return NextResponse.json(
        { error: 'task_name and task_class are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('system_tasks')
      .insert({
        task_name,
        task_class,
        enabled: enabled !== undefined ? enabled : true,
        run_interval: run_interval || 86400,
        last_status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating system task:', error)
      return NextResponse.json(
        { error: 'Failed to create system task', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'system_task_created',
      'system_task',
      data.id,
      { task_name, task_class }
    )

    return NextResponse.json({
      message: 'System task created successfully',
      task: data,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


