/**
 * Email Templates Server Actions - Update
 * 
 * Server Actions for updating email templates.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { emailTemplateUpdateSchema, emailTemplateStatusSchema } from '@/lib/validators/email-templates'
import { sanitizeHTML } from '@/lib/security/sanitize-html'

/**
 * Update email template
 */
export async function updateEmailTemplate(values: z.infer<typeof emailTemplateUpdateSchema>) {
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

    // Validate input
    const data = emailTemplateUpdateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing template for audit log
    const { data: existingTemplate } = await client
      .from('email_templates')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingTemplate) {
      return {
        success: false,
        error: 'Template not found',
        data: null,
      }
    }

    // Check if template can be disabled
    if (data.enabled === false && !existingTemplate.can_disable) {
      return {
        success: false,
        error: 'This template cannot be disabled',
        data: null,
      }
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.subject !== undefined) {
      // Sanitize subject (basic text, no HTML)
      updateData.subject = sanitizeHTML(data.subject).replace(/<[^>]*>/g, '')
    }

    if (data.body !== undefined) {
      // Sanitize body (allow HTML but sanitize dangerous content)
      updateData.body = sanitizeHTML(data.body)
    }

    if (data.enabled !== undefined) {
      updateData.enabled = data.enabled
    }

    // Update template
    const { data: updatedTemplate, error } = await client
      .from('email_templates')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateEmailTemplate] Error updating email template:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await auditLog({
      action: 'email_template_updated',
      entity_type: 'email_template',
      entity_id: data.id,
      details: {
        template_key: existingTemplate.key,
        template_name: existingTemplate.name,
        changes: {
          subject: data.subject !== undefined ? { before: existingTemplate.subject, after: updateData.subject } : undefined,
          body: data.body !== undefined ? { changed: true } : undefined,
          enabled: data.enabled !== undefined ? { before: existingTemplate.enabled, after: updateData.enabled } : undefined,
        },
      },
      user_id: authCheck.user?.id,
    })

    // Revalidate paths
    revalidatePath('/admin/email-templates')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        template: updatedTemplate,
      },
    }
  } catch (error: any) {
    console.error('[updateEmailTemplate] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
        data: null,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Update email template status (enabled/disabled)
 */
export async function updateEmailTemplateStatus(values: z.infer<typeof emailTemplateStatusSchema>) {
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

    // Validate input
    const data = emailTemplateStatusSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing template
    const { data: existingTemplate } = await client
      .from('email_templates')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingTemplate) {
      return {
        success: false,
        error: 'Template not found',
        data: null,
      }
    }

    // Check if template can be disabled
    if (data.enabled === false && !existingTemplate.can_disable) {
      return {
        success: false,
        error: 'This template cannot be disabled',
        data: null,
      }
    }

    // Update template status
    const { data: updatedTemplate, error } = await client
      .from('email_templates')
      .update({
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateEmailTemplateStatus] Error updating email template status:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await auditLog({
      action: 'email_template_status_updated',
      entity_type: 'email_template',
      entity_id: data.id,
      details: {
        template_key: existingTemplate.key,
        template_name: existingTemplate.name,
        enabled: data.enabled,
      },
      user_id: authCheck.user?.id,
    })

    // Revalidate paths
    revalidatePath('/admin/email-templates')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        template: updatedTemplate,
      },
    }
  } catch (error: any) {
    console.error('[updateEmailTemplateStatus] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
        data: null,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

