/**
 * Site Settings Validators
 * 
 * Zod schemas for validating site settings data
 */

import { z } from 'zod'

/**
 * Site settings update schema
 */
export const siteSettingsUpdateSchema = z.object({
  setting_name: z.string().min(1, 'Setting name is required'),
  setting_value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]),
  setting_type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  setting_group: z.enum(['general', 'email', 'security', 'appearance', 'localization']).default('general'),
  description: z.string().optional().nullable(),
})

/**
 * Bulk site settings update schema
 */
export const bulkSiteSettingsUpdateSchema = z.object({
  settings: z.array(siteSettingsUpdateSchema).min(1, 'At least one setting is required'),
})

/**
 * Site branding settings schema
 */
export const siteBrandingSchema = z.object({
  site_name: z.string().min(1, 'Site name is required'),
  logo_url: z.string().url().optional().nullable(),
  favicon_url: z.string().url().optional().nullable(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
})

/**
 * Site contact settings schema
 */
export const siteContactSchema = z.object({
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().optional().nullable(),
  support_email: z.string().email('Invalid email address').optional().nullable(),
  support_phone: z.string().optional().nullable(),
})

/**
 * Site security settings schema
 */
export const siteSecuritySchema = z.object({
  max_upload_size: z.number().int().positive('Max upload size must be positive'),
  allowed_mime_types: z.array(z.string()).min(1, 'At least one MIME type is required'),
  html_sanitization_enabled: z.boolean().default(true),
  csp_enabled: z.boolean().default(true),
  csp_policy: z.string().optional().nullable(),
  recaptcha_enabled: z.boolean().default(false),
  recaptcha_site_key: z.string().optional().nullable(),
  recaptcha_secret_key: z.string().optional().nullable(),
  two_factor_enabled: z.boolean().default(false),
})

/**
 * Site maintenance settings schema
 */
export const siteMaintenanceSchema = z.object({
  maintenance_mode: z.boolean().default(false),
  maintenance_message: z.string().optional().nullable(),
  maintenance_start: z.string().datetime().optional().nullable(),
  maintenance_end: z.string().datetime().optional().nullable(),
})

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>
export type BulkSiteSettingsUpdateInput = z.infer<typeof bulkSiteSettingsUpdateSchema>
export type SiteBrandingInput = z.infer<typeof siteBrandingSchema>
export type SiteContactInput = z.infer<typeof siteContactSchema>
export type SiteSecurityInput = z.infer<typeof siteSecuritySchema>
export type SiteMaintenanceInput = z.infer<typeof siteMaintenanceSchema>



