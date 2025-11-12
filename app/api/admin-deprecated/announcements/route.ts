import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/announcements
 * Get all announcements
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const offset = (page - 1) * limit

    let query = supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('date_posted', { ascending: false })
      .range(offset, offset + limit - 1)

    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true')
    }

    const { data: announcements, error, count } = await query

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json(
        { error: 'Failed to fetch announcements', details: error.message },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      announcements: announcements || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/announcements
 * Create new announcement
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase, user } = authCheck
    const body = await request.json()

    const { title, description, short_description, type, enabled, date_expire } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        description: description || null,
        short_description: short_description || null,
        type: type || 'info',
        enabled: enabled !== undefined ? enabled : true,
        date_expire: date_expire || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating announcement:', error)
      return NextResponse.json(
        { error: 'Failed to create announcement', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'announcement_created',
      'announcement',
      data.id,
      { title }
    )

    return NextResponse.json({
      message: 'Announcement created successfully',
      announcement: data,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

