'use client'

import { useState } from 'react'
import { Edit, Trash2, Globe } from 'lucide-react'

export interface Issue {
  id: string
  journal_id: string
  volume: number | null
  number: string | null
  year: number
  title: string | null
  description: string | null
  published_date: string | null
  is_published: boolean
  itemCount?: number
  status?: 'draft' | 'scheduled' | 'published'
  journal_title?: string
}

interface IssueTableProps {
  issues: Issue[]
  onEdit: (issue: Issue) => void
  onDelete: (id: string) => void
  onPublish?: (id: string) => void
  onRefresh: () => void
}

export default function IssueTable({ issues, onEdit, onDelete, onPublish, onRefresh }: IssueTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }

    try {
      await onDelete(id)
      setDeleteConfirm(null)
    } catch (error: any) {
      setDeleteConfirm(null)
    }
  }

  const formatIssueName = (issue: Issue) => {
    const parts: string[] = []
    if (issue.volume) parts.push(`Vol. ${issue.volume}`)
    if (issue.number) parts.push(`No. ${issue.number}`)
    if (issue.year) parts.push(`(${issue.year})`)
    const base = parts.length > 0 ? parts.join(' ') : `Tahun ${issue.year}`
    return issue.title ? `${base}: ${issue.title}` : base
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      scheduled: { label: 'Dijadwalkan', className: 'bg-yellow-100 text-yellow-800' },
      published: { label: 'Terbit', className: 'bg-green-100 text-green-800' },
    }
    
    const statusInfo = statusMap[status] || statusMap.draft
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="overflow-hidden">
      {issues.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Tidak ada isu ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Isu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nomor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tahun
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatIssueName(issue)}
                    </div>
                    {issue.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                        {issue.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{issue.volume || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{issue.number || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{issue.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{issue.itemCount || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(issue.status || 'draft')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(issue)}
                        className="text-[#0056A1] hover:text-[#003d5c] transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {onPublish && issue.status === 'scheduled' && (
                        <button
                          onClick={() => onPublish(issue.id)}
                          className="text-green-600 hover:text-green-700 transition-colors"
                          title="Publikasi"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className={`transition-colors ${
                          deleteConfirm === issue.id
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-red-500 hover:text-red-600'
                        }`}
                        title={deleteConfirm === issue.id ? 'Klik lagi untuk konfirmasi' : 'Hapus'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

