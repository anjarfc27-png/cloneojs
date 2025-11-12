/**
 * Audit Logging Utility
 * 
 * Provides centralized audit logging for all system actions.
 * All state-changing operations should log to audit_logs table.
 * 
 * Audit logs are immutable and cannot be deleted or modified.
 */

import { createAdminClient } from '@/lib/db/supabase-admin'
import { getCurrentUser } from '@/lib/auth/current-user'
import { headers } from 'next/headers'

export interface AuditLogEntry {
  action: string
  entity_type?: string
  entity_id?: string | null
  details?: Record<string, any>
  user_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

/**
 * Get client IP address from request headers
 */
async function getClientIP(): Promise<string | null> {
  try {
    const headersList = await headers()
    // Check common headers for client IP
    const forwarded = headersList.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    const realIP = headersList.get('x-real-ip')
    if (realIP) {
      return realIP
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Get user agent from request headers
 */
async function getUserAgent(): Promise<string | null> {
  try {
    const headersList = await headers()
    return headersList.get('user-agent') || null
  } catch {
    return null
  }
}

/**
 * Log an audit event
 * 
 * This function should be called from Server Actions after any state-changing operation.
 * 
 * @param entry - Audit log entry
 * @returns Promise that resolves when log is written
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const client = createAdminClient()
    const user = await getCurrentUser()
    const ipAddress = await getClientIP()
    const userAgent = await getUserAgent()

    const { error } = await client.from('activity_logs').insert({
      user_id: user?.id || entry.user_id || null,
      action: entry.action,
      entity_type: entry.entity_type || null,
      entity_id: entry.entity_id || null,
      details: entry.details || {},
      ip_address: ipAddress || entry.ip_address || null,
      user_agent: userAgent || entry.user_agent || null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[auditLog] Error writing audit log:', error.message)
      // Don't throw - audit logging failure shouldn't break the main operation
      // But log it for monitoring
    }
  } catch (error: any) {
    console.error('[auditLog] Exception writing audit log:', error?.message)
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Log a user action
 * 
 * Convenience function for logging user-related actions
 */
export async function logUserAction(
  action: string,
  entityId: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    action,
    entity_type: 'user',
    entity_id: entityId,
    details,
  })
}

/**
 * Log a journal action
 * 
 * Convenience function for logging journal-related actions
 */
export async function logJournalAction(
  action: string,
  entityId: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    action,
    entity_type: 'journal',
    entity_id: entityId,
    details,
  })
}

/**
 * Log a settings action
 * 
 * Convenience function for logging settings-related actions
 */
export async function logSettingsAction(
  action: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    action,
    entity_type: 'settings',
    details,
  })
}

/**
 * Log a security event
 * 
 * Convenience function for logging security-related events
 */
export async function logSecurityEvent(
  action: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    action,
    entity_type: 'security',
    details,
  })
}



