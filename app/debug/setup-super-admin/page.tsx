'use client'

import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '@/lib/api/client'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'

interface SuperAdminStatus {
  authenticated: boolean
  user?: {
    id: string
    email: string
  }
  is_super_admin: boolean
  role: string | null
  tenant_id: string | null
  created_at: string | null
  message: string
}

export default function SetupSuperAdminPage() {
  const [status, setStatus] = useState<SuperAdminStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setting, setSetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGet<SuperAdminStatus>('/api/debug/setup-super-admin-v2')
      setStatus(data)
    } catch (err: any) {
      setError(err.message || 'Failed to check status')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    if (!status?.user?.email && !status?.user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setSetting(true)
      setError(null)
      setSuccess(false)

      // Try using user_id directly if available, otherwise use email
      const result = status.user?.id
        ? await apiPost('/api/debug/setup-super-admin-direct', {
            user_id: status.user.id,
            email: status.user.email,
          })
        : await apiPost('/api/debug/setup-super-admin-v2', {
            email: status.user?.email,
          })

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        checkStatus()
        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/admin/dashboard'
        }, 2000)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to setup super admin')
    } finally {
      setSetting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056A1] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking status...</p>
        </div>
      </div>
    )
  }

  if (!status?.authenticated) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
        <ContentCard>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup Super Admin</h1>
            <p className="text-gray-600 mb-4">You are not authenticated. Please login first.</p>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors"
            >
              Go to Login
            </a>
          </div>
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Super Admin</h1>
          <p className="text-gray-600">Check and setup super admin role for your account</p>
        </div>

        {error && <ErrorAlert message={error} />}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">Super admin role created successfully!</p>
            <p className="text-green-600 text-sm mt-1">Redirecting to admin dashboard...</p>
          </div>
        )}

        <ContentCard>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h2>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Email:</dt>
                  <dd className="text-sm text-gray-900">{status.user?.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">User ID:</dt>
                  <dd className="text-sm text-gray-900 font-mono text-xs">
                    {status.user?.id.substring(0, 8)}...
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Role:</dt>
                  <dd className="text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        status.is_super_admin
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {status.role || 'No role assigned'}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Super Admin:</dt>
                  <dd className="text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        status.is_super_admin
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status.is_super_admin ? 'Yes' : 'No'}
                    </span>
                  </dd>
                </div>
                {status.created_at && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Created At:</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(status.created_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">{status.message}</p>

              {status.is_super_admin ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-medium">
                      ✅ You are already a super admin!
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      You can access the admin dashboard at{' '}
                      <a
                        href="/admin/dashboard"
                        className="underline hover:text-green-800"
                      >
                        /admin/dashboard
                      </a>
                    </p>
                  </div>
                  <a
                    href="/admin/dashboard"
                    className="inline-block w-full text-center px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors"
                  >
                    Go to Admin Dashboard
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 font-medium">
                      ⚠️ You are not a super admin yet
                    </p>
                    <p className="text-yellow-600 text-sm mt-1">
                      Click the button below to setup super admin role for your account.
                    </p>
                  </div>
                  <button
                    onClick={handleSetup}
                    disabled={setting}
                    className="w-full px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {setting ? 'Setting up...' : 'Setup Super Admin Role'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={checkStatus}
                className="text-sm text-[#0056A1] hover:text-[#003d5c] hover:underline"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </ContentCard>

        <ContentCard>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">SQL Alternative</h3>
            <p className="text-sm text-gray-600">
              If the button above doesn't work, you can run this SQL script in Supabase SQL Editor:
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Jika tombol di atas tidak bekerja, ikuti langkah berikut:
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-4">
                <li>Buka Supabase Dashboard > Authentication > Users</li>
                <li>Cari user dengan email: <strong>{status.user?.email}</strong></li>
                <li>Copy User UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)</li>
                <li>Buka Supabase Dashboard > SQL Editor</li>
                <li>Jalankan script berikut (ganti YOUR_USER_ID_HERE dengan UUID dari step 3):</li>
              </ol>
              <pre className="p-4 bg-gray-50 rounded-md text-xs overflow-x-auto mt-2">
{`-- Step 1: Create default tenant
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Setup super admin untuk user_id: ${status.user?.id || 'YOUR_USER_ID_HERE'}
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
SELECT 
  '${status.user?.id || 'YOUR_USER_ID_HERE'}'::UUID,
  t.id,
  'super_admin',
  true
FROM tenants t
WHERE t.slug = 'default-journal'
ON CONFLICT (user_id, tenant_id)
DO UPDATE SET 
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- Step 3: Verify
SELECT 
  tu.user_id,
  tu.role,
  tu.is_active,
  t.name as tenant_name
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.user_id = '${status.user?.id || 'YOUR_USER_ID_HERE'}'::UUID
ORDER BY tu.created_at DESC;`}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                <strong>Catatan:</strong> Script di atas sudah menggunakan user_id Anda. Jika user_id tidak muncul, ganti YOUR_USER_ID_HERE dengan UUID yang Anda copy dari Supabase Auth dashboard.
              </p>
              {status.user?.id && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800">
                    <strong>User ID Anda:</strong> <code className="bg-blue-100 px-1 rounded">{status.user.id}</code>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Script SQL di atas sudah siap digunakan dengan user_id Anda. Copy dan jalankan di Supabase SQL Editor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ContentCard>
      </div>
    </div>
  )
}

