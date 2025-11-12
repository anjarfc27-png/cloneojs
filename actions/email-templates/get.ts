/**
 * Email Templates Server Actions - Get
 * 
 * Server Actions for retrieving email templates.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'

export interface EmailTemplate {
  id: string
  key: string
  name: string
  subject: string | null
  body: string | null
  description: string | null
  enabled: boolean
  can_disable: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all email templates
 */
export async function getEmailTemplates() {
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

    // Get all email templates
    const { data: templates, error } = await client
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[getEmailTemplates] Error fetching email templates:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      data: {
        templates: templates || [],
      },
    }
  } catch (error: any) {
    console.error('[getEmailTemplates] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get single email template by ID
 */
export async function getEmailTemplate(id: string) {
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

    // Validate ID
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid template ID',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get email template
    const { data: template, error } = await client
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[getEmailTemplate] Error fetching email template:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    if (!template) {
      return {
        success: false,
        error: 'Template not found',
        data: null,
      }
    }

    return {
      success: true,
      data: {
        template,
      },
    }
  } catch (error: any) {
    console.error('[getEmailTemplate] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

