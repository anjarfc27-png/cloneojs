'use client'

import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export default function ErrorAlert({ message, onDismiss, className = '' }: ErrorAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative ${className}`}>
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span className="text-sm">{message}</span>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="ml-auto text-red-700 hover:text-red-900"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

