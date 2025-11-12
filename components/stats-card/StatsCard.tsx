/**
 * Stats Card Component
 * 
 * A standardized card component for displaying statistics.
 * Used in dashboard and other summary views.
 */

import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

export interface StatsCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'orange' | 'purple'
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  className,
}: StatsCardProps) {
  return (
    <div className={clsx('bg-white rounded-lg shadow p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p
              className={clsx(
                'mt-2 text-sm font-medium',
                trend.positive !== false ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.positive !== false ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-3 rounded-full', colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}



