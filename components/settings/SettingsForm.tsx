'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function SettingsForm() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient()
        
        // Try to get user with retry logic
        let userData = null
        for (let attempt = 1; attempt <= 5; attempt++) {
          const { data, error } = await supabase.auth.getUser()
          
          if (error) {
            console.error(`[SETTINGS] Error getting user (attempt ${attempt}):`, error.message)
          }
          
          if (data.user) {
            userData = data.user
            break
          }
          
          if (attempt < 5) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
        
        if (userData) {
          setUser(userData)
          setFormData({
            email: userData.email || '',
            full_name: userData.user_metadata?.full_name || '',
          })
        } else {
          console.error('[SETTINGS] No user found after retries')
          setMessage({ type: 'error', text: 'Tidak dapat memuat data pengguna' })
        }
      } catch (error: any) {
        console.error('[SETTINGS] Error loading user data:', error)
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat data' })
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
        },
      })

      if (error) throw error

      // Refresh user data
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser) {
        setUser(updatedUser)
      }

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Memuat data...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          <p>Tidak dapat memuat data pengguna. Silakan refresh halaman.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {message && (
        <div className={`mb-4 px-4 py-3 rounded ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-sm text-gray-500">Email tidak dapat diubah</p>
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Nama Lengkap
          </label>
          <input
            type="text"
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}

