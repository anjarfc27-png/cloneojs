'use client'

import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'

export interface Journal {
  id: string
  title: string
  issn: string | null
  e_issn: string | null
  description: string | null
  editor_name: string | null
  editor_id: string | null
  is_active: boolean
  created_at: string
  tenant_id: string
  tenant_name?: string
}

interface JournalTableProps {
  journals: Journal[]
  onEdit: (journal: Journal) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export default function JournalTable({ journals, onEdit, onDelete, onRefresh }: JournalTableProps) {
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
      // Error handled by parent
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="overflow-hidden">
      {journals.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Tidak ada jurnal ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Jurnal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ISSN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Editor Utama
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
              {journals.map((journal) => (
                <tr key={journal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{journal.title}</div>
                    {journal.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {journal.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {journal.issn || journal.e_issn || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {journal.editor_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        journal.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {journal.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(journal)}
                        className="text-[#0056A1] hover:text-[#003d5c] transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(journal.id)}
                        className={`transition-colors ${
                          deleteConfirm === journal.id
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-red-500 hover:text-red-600'
                        }`}
                        title={deleteConfirm === journal.id ? 'Klik lagi untuk konfirmasi' : 'Hapus'}
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

