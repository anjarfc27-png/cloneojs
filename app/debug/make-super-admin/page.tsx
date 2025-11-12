'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MakeSuperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [canAssign, setCanAssign] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      // Check if user can assign roles
      const response = await fetch('/api/debug/make-super-admin')
      const data = await response.json()
      
      if (response.ok) {
        setCanAssign(data.canAssignRole)
      }
    } catch (err) {
      console.error('Error checking user:', err)
    }
  }

  const makeSuperAdmin = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/debug/make-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'anjarbdn@gmail.com'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Super admin role created successfully!')
      } else {
        setError(data.error || 'Failed to create super admin role')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login First</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Make Super Admin
          </h1>
          <p className="text-gray-600">
            Assign super admin role to anjarbdn@gmail.com
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Current User:</strong> {currentUser.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Target User:</strong> anjarbdn@gmail.com
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {message}
            </div>
          )}

          {!canAssign && currentUser.email !== 'anjarbdn@gmail.com' ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
              You don't have permission to assign super admin roles. Only super admins can do this.
            </div>
          ) : (
            <button
              onClick={makeSuperAdmin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Processing...' : 'Make Super Admin'}
            </button>
          )}
        </div>

        <div className="text-center">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}