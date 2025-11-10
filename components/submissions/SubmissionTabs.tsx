'use client'

import { useState } from 'react'
import Tabs from '@/components/shared/Tabs'

interface SubmissionTabsProps {
  initialTab?: string
}

export default function SubmissionTabs({ initialTab = 'my-queue' }: SubmissionTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  const tabs = [
    { id: 'my-queue', label: 'My Queue' },
    { id: 'unassigned', label: 'Unassigned', badge: 3 },
    { id: 'all-active', label: 'All Active', badge: 13 },
    { id: 'archives', label: 'Archives', badge: 8 },
  ]

  return (
    <div className="mb-6">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

