import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/email-templates/[id]
 * Get single email template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching email template:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email template', details: error.message },
        { status: 500 }
      )
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      template,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/email-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/email-templates/[id]
 * Update email template
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
    const { supabase } = authCheck
    const body = await request.json()

    const { subject, body: templateBody, enabled } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (subject !== undefined) {
      updateData.subject = subject
    }

    if (templateBody !== undefined) {
      updateData.body = templateBody
    }

    if (enabled !== undefined) {
      updateData.enabled = enabled
    }

    const { data, error } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating email template:', error)
      return NextResponse.json(
        { error: 'Failed to update email template', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'email_template_updated',
      'email_template',
      params.id,
      { template_key: data.key }
    )

    return NextResponse.json({
      message: 'Email template updated successfully',
      template: data,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/email-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

