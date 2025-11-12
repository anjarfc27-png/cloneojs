import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/email-templates
 * Get all email templates
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email templates', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: templates || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/email-templates/:id
 * Update email template
 */
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck
    const body = await request.json()

    const { id, subject, body: templateBody, enabled } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

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
      .eq('id', id)
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
      id,
      { template_key: data.key }
    )

    return NextResponse.json({
      message: 'Email template updated successfully',
      template: data,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

