/**
 * Plugins Validators
 * 
 * Zod schemas for validating plugin data
 */

import { z } from 'zod'

/**
 * Plugin setting schema
 */
export const pluginSettingSchema = z.object({
  setting_name: z.string().min(1, 'Setting name is required'),
  setting_value: z.union([z.string(), z.number(), z.boolean()]),
  setting_type: z.enum(['string', 'number', 'boolean', 'object']).optional().default('string'),
})

/**
 * Plugin update schema
 */
export const pluginUpdateSchema = z.object({
  journal_id: z.string().uuid().nullable().optional(),
  enabled: z.boolean().optional(),
  settings: z.array(pluginSettingSchema).optional(),
})

/**
 * Plugin settings create/update schema
 */
export const pluginSettingsSchema = z.object({
  plugin_name: z.string().min(1, 'Plugin name is required'),
  journal_id: z.string().uuid().nullable().optional(),
  settings: z.array(pluginSettingSchema).min(1, 'At least one setting is required'),
})

export type PluginSettingInput = z.infer<typeof pluginSettingSchema>
export type PluginUpdateInput = z.infer<typeof pluginUpdateSchema>
export type PluginSettingsInput = z.infer<typeof pluginSettingsSchema>

