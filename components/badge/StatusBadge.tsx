/**
 * Status Badge Component
 * 
 * A standardized badge component for displaying status indicators.
 * Used throughout the Super Admin interface for consistent status display.
 */

import { clsx } from 'clsx'

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'published'
  | 'draft'
  | 'scheduled'
  | 'suspended'
  | 'archived'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

export interface StatusBadgeProps {
  status: StatusVariant | string
  label?: string
  className?: string
}

const statusClasses: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  published: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-purple-100 text-purple-800',
  suspended: 'bg-orange-100 text-orange-800',
  archived: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
  suspended: 'Suspended',
  archived: 'Archived',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusClass = statusClasses[status.toLowerCase()] || statusClasses.info
  const statusLabel = label || statusLabels[status.toLowerCase()] || status

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusClass,
        className
      )}
    >
      {statusLabel}
    </span>
  )
}



