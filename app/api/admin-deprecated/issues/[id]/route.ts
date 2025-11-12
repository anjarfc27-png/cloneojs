import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateIssue, deleteIssue, publishIssue, IssueInsert } from '@/lib/supabase/issueService'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * PUT /api/admin/issues/[id] - Update issue
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }

    const body = await request.json()
    const { volume, number, year, title, description, published_date, status, access_status } = body

    // Validation
    if (year === undefined || year === null) {
      return NextResponse.json(
        { error: 'year is required' },
        { status: 400 }
      )
    }

    // Map status to is_published and published_date
    let is_published = false
    let finalPublishedDate = published_date || null

    if (status === 'published') {
      is_published = true
      if (!finalPublishedDate) {
        finalPublishedDate = new Date().toISOString()
      }
    } else if (status === 'scheduled') {
      is_published = false
      if (!finalPublishedDate) {
        return NextResponse.json(
          { error: 'published_date is required for scheduled status' },
          { status: 400 }
        )
      }
    } else {
      // draft
      is_published = false
      finalPublishedDate = null
    }

    const updateData: Partial<IssueInsert> = {
      volume: volume || null,
      number: number || null,
      year,
      title: title || null,
      description: description || null,
      published_date: finalPublishedDate,
      is_published,
      access_status: access_status || 'open',
    }

    const issue = await updateIssue(params.id, updateData)

    return NextResponse.json({ issue })
  } catch (error: any) {
    console.error('Error updating issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to update issue' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/issues/[id] - Delete issue
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }

    await deleteIssue(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete issue' }, { status: 500 })
  }
}


