/**
 * Site Settings Server Actions
 * 
 * Server Actions for managing site settings.
 * Follows the standard Server Action template.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction, logSecurityEvent } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { ServerActionAuthOptions } from '@/lib/admin/types'
import {
  siteSettingsUpdateSchema,
  bulkSiteSettingsUpdateSchema,
  siteBrandingSchema,
  siteContactSchema,
  siteSecuritySchema,
  siteMaintenanceSchema,
} from '@/lib/validators/site-settings'

/**
 * Update a single site setting
 */
export async function updateSiteSetting(
  values: z.infer<typeof siteSettingsUpdateSchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Validate input
    const data = siteSettingsUpdateSchema.parse(values)

    // Sanitize HTML if setting type is string and contains HTML
    let sanitizedValue: any = data.setting_value
    if (data.setting_type === 'string' && typeof data.setting_value === 'string') {
      // Check if value might contain HTML
      if (data.setting_value.includes('<') || data.setting_value.includes('>')) {
        sanitizedValue = sanitizeHTML(data.setting_value)
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get existing setting for audit log
    const { data: existing } = await client
      .from('site_settings')
      .select('setting_name, setting_value')
      .eq('setting_name', data.setting_name)
      .maybeSingle()

    // Update or insert setting
    const { data: updated, error } = await client
      .from('site_settings')
      .upsert({
        setting_name: data.setting_name,
        setting_value: typeof sanitizedValue === 'object' 
          ? JSON.stringify(sanitizedValue) 
          : String(sanitizedValue),
        setting_type: data.setting_type,
        setting_group: data.setting_group,
        description: data.description,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_name',
      })
      .select()
      .single()

    if (error) {
      console.error('[updateSiteSetting] Error updating setting:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Log audit event
    await logSettingsAction('update_site_setting', {
      setting_name: data.setting_name,
      before: existing?.setting_value,
      after: updated.setting_value,
    })

    // Revalidate paths
    revalidatePath('/admin/settings')

    return {
      success: true,
      data: updated,
    }
  } catch (error: any) {
    console.error('[updateSiteSetting] Unexpected error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update multiple site settings (bulk update)
 */
export async function updateSiteSettingsBulk(
  values: z.infer<typeof bulkSiteSettingsUpdateSchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Validate input
    const data = bulkSiteSettingsUpdateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Prepare updates
    const updates = data.settings.map((setting) => {
      let sanitizedValue: any = setting.setting_value
      
      // Sanitize HTML if needed
      if (setting.setting_type === 'string' && typeof setting.setting_value === 'string') {
        if (setting.setting_value.includes('<') || setting.setting_value.includes('>')) {
          sanitizedValue = sanitizeHTML(setting.setting_value)
        }
      }

      return {
        setting_name: setting.setting_name,
        setting_value: typeof sanitizedValue === 'object'
          ? JSON.stringify(sanitizedValue)
          : String(sanitizedValue),
        setting_type: setting.setting_type,
        setting_group: setting.setting_group,
        description: setting.description,
        updated_at: new Date().toISOString(),
      }
    })

    // Bulk upsert
    const { data: updated, error } = await client
      .from('site_settings')
      .upsert(updates, {
        onConflict: 'setting_name',
      })
      .select()

    if (error) {
      console.error('[updateSiteSettingsBulk] Error updating settings:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Log audit event
    await logSettingsAction('update_site_settings_bulk', {
      settings_count: updates.length,
      setting_names: updates.map((s) => s.setting_name),
    })

    // Revalidate paths
    revalidatePath('/admin/settings')

    return {
      success: true,
      data: updated,
      count: updated?.length || 0,
    }
  } catch (error: any) {
    console.error('[updateSiteSettingsBulk] Unexpected error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update site branding settings
 */
export async function updateSiteBranding(
  values: z.infer<typeof siteBrandingSchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const data = siteBrandingSchema.parse(values)

    const client = createAdminClient()

    // Update site branding settings
    const settings = [
      { setting_name: 'site_name', setting_value: data.site_name, setting_type: 'string', setting_group: 'general' },
      { setting_name: 'logo_url', setting_value: data.logo_url || '', setting_type: 'string', setting_group: 'appearance' },
      { setting_name: 'favicon_url', setting_value: data.favicon_url || '', setting_type: 'string', setting_group: 'appearance' },
      { setting_name: 'primary_color', setting_value: data.primary_color || '', setting_type: 'string', setting_group: 'appearance' },
      { setting_name: 'secondary_color', setting_value: data.secondary_color || '', setting_type: 'string', setting_group: 'appearance' },
    ]

    const { error } = await client
      .from('site_settings')
      .upsert(settings.map((s) => ({
        ...s,
        updated_at: new Date().toISOString(),
      })), {
        onConflict: 'setting_name',
      })

    if (error) {
      console.error('[updateSiteBranding] Error updating branding:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    await logSettingsAction('update_site_branding', {
      site_name: data.site_name,
    })

    revalidatePath('/admin/settings')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[updateSiteBranding] Unexpected error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update site contact settings
 */
export async function updateSiteContact(
  values: z.infer<typeof siteContactSchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const data = siteContactSchema.parse(values)

    const client = createAdminClient()

    const settings = [
      { setting_name: 'contact_email', setting_value: data.contact_email, setting_type: 'string', setting_group: 'general' },
      { setting_name: 'contact_phone', setting_value: data.contact_phone || '', setting_type: 'string', setting_group: 'general' },
      { setting_name: 'support_email', setting_value: data.support_email || '', setting_type: 'string', setting_group: 'general' },
      { setting_name: 'support_phone', setting_value: data.support_phone || '', setting_type: 'string', setting_group: 'general' },
    ]

    const { error } = await client
      .from('site_settings')
      .upsert(settings.map((s) => ({
        ...s,
        updated_at: new Date().toISOString(),
      })), {
        onConflict: 'setting_name',
      })

    if (error) {
      console.error('[updateSiteContact] Error updating contact:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    await logSettingsAction('update_site_contact', {})

    revalidatePath('/admin/settings')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[updateSiteContact] Unexpected error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update site security settings
 */
export async function updateSiteSecurity(
  values: z.infer<typeof siteSecuritySchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const data = siteSecuritySchema.parse(values)

    const client = createAdminClient()

    const settings = [
      { setting_name: 'max_upload_size', setting_value: String(data.max_upload_size), setting_type: 'number', setting_group: 'security' },
      { setting_name: 'allowed_mime_types', setting_value: JSON.stringify(data.allowed_mime_types), setting_type: 'json', setting_group: 'security' },
      { setting_name: 'html_sanitization_enabled', setting_value: String(data.html_sanitization_enabled), setting_type: 'boolean', setting_group: 'security' },
      { setting_name: 'csp_enabled', setting_value: String(data.csp_enabled), setting_type: 'boolean', setting_group: 'security' },
      { setting_name: 'csp_policy', setting_value: data.csp_policy || '', setting_type: 'string', setting_group: 'security' },
      { setting_name: 'recaptcha_enabled', setting_value: String(data.recaptcha_enabled), setting_type: 'boolean', setting_group: 'security' },
      { setting_name: 'recaptcha_site_key', setting_value: data.recaptcha_site_key || '', setting_type: 'string', setting_group: 'security' },
      { setting_name: 'two_factor_enabled', setting_value: String(data.two_factor_enabled), setting_type: 'boolean', setting_group: 'security' },
    ]

    const { error } = await client
      .from('site_settings')
      .upsert(settings.map((s) => ({
        ...s,
        updated_at: new Date().toISOString(),
      })), {
        onConflict: 'setting_name',
      })

    if (error) {
      console.error('[updateSiteSecurity] Error updating security:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    await logSecurityEvent('update_site_security', {})

    revalidatePath('/admin/settings')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[updateSiteSecurity] Unexpected error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update site maintenance settings
 */
export async function updateSiteMaintenance(
  values: z.infer<typeof siteMaintenanceSchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const data = siteMaintenanceSchema.parse(values)

    const client = createAdminClient()

    // Sanitize maintenance message if provided
    let sanitizedMessage = data.maintenance_message
    if (sanitizedMessage) {
      sanitizedMessage = sanitizeHTML(sanitizedMessage)
    }

    const settings = [
      { setting_name: 'maintenance_mode', setting_value: String(data.maintenance_mode), setting_type: 'boolean', setting_group: 'general' },
      { setting_name: 'maintenance_message', setting_value: sanitizedMessage || '', setting_type: 'string', setting_group: 'general' },
      { setting_name: 'maintenance_start', setting_value: data.maintenance_start || '', setting_type: 'string', setting_group: 'general' },
      { setting_name: 'maintenance_end', setting_value: data.maintenance_end || '', setting_type: 'string', setting_group: 'general' },
    ]

    const { error } = await client
      .from('site_settings')
      .upsert(settings.map((s) => ({
        ...s,
        updated_at: new Date().toISOString(),
      })), {
        onConflict: 'setting_name',
      })

    if (error) {
      console.error('[updateSiteMaintenance] Error updating maintenance:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    await logSettingsAction('update_site_maintenance', {
      maintenance_mode: data.maintenance_mode,
    })

    revalidatePath('/admin/settings')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[updateSiteMaintenance] Unexpected error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

