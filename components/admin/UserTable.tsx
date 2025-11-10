'use client'

import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  tenant_id?: string
  tenant_name?: string
}

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  editor: 'Editor',
  section_editor: 'Section Editor',
  reviewer: 'Reviewer',
  author: 'Author',
  reader: 'Reader',
}

export default function UserTable({ users, onEdit, onDelete, onRefresh }: UserTableProps) {
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
      {users.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Tidak ada pengguna ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Lengkap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="text-[#0056A1] hover:text-[#003d5c] transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className={`transition-colors ${
                          deleteConfirm === user.id
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-red-500 hover:text-red-600'
                        }`}
                        title={deleteConfirm === user.id ? 'Klik lagi untuk konfirmasi' : 'Hapus'}
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

