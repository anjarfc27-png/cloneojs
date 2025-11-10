'use client'

import { ReactNode } from 'react'

interface ContentCardProps {
  children: ReactNode
  className?: string
}

export default function ContentCard({ children, className = '' }: ContentCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-6 ${className}`}>
      {children}
    </div>
  )
}

