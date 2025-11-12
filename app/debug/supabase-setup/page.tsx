'use client';

import { useState, useEffect } from 'react';

interface UserStatus {
  exists: boolean;
  user?: {
    id: string;
    email: string;
    created_at: string;
  };
  roles?: Array<{
    id: string;
    role: string;
    tenant_id: string;
    tenants: {
      name: string;
      slug: string;
    };
  }>;
  is_super_admin: boolean;
}

export default function SupabaseSetupPage() {
  const [email, setEmail] = useState('anjarbdn@gmail.com');
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sqlScript, setSqlScript] = useState('');

  useEffect(() => {
    // Generate SQL script berdasarkan email
    const script = `-- Simple Setup Super Admin untuk ${email}
-- Jalankan script ini di Supabase Dashboard > SQL Editor

-- 1. Buat tenant default jika belum ada
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Journal', 'default-journal', 'Default journal for super admin', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Dapatkan ID tenant default
DO $$
DECLARE
  target_email TEXT := '${email}';
  target_user_id UUID;
  default_tenant_id UUID;
  existing_role TEXT;
BEGIN
  -- Cari user_id berdasarkan email
  SELECT au.id INTO target_user_id 
  FROM auth.users au 
  WHERE au.email = target_email
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User tidak ditemukan: %', target_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'User ditemukan: % dengan ID: %', target_email, target_user_id;
  
  -- Dapatkan default tenant ID
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE slug = 'default-journal' 
  LIMIT 1;
  
  RAISE NOTICE 'Tenant ID: %', default_tenant_id;
  
  -- Buat journal default untuk tenant
  INSERT INTO journals (tenant_id, title, description, abbreviation, language, is_active)
  SELECT 
    default_tenant_id,
    'Default Journal',
    'Default journal for super admin management',
    'DJ',
    'id',
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM journals j WHERE j.tenant_id = default_tenant_id
  );
  
  -- Cek apakah user sudah memiliki role di tenant ini
  SELECT role INTO existing_role
  FROM tenant_users 
  WHERE user_id = target_user_id 
  AND tenant_id = default_tenant_id;
  
  IF existing_role IS NOT NULL THEN
    -- Update role menjadi super_admin jika sudah ada
    UPDATE tenant_users 
    SET role = 'super_admin', updated_at = NOW()
    WHERE user_id = target_user_id 
    AND tenant_id = default_tenant_id;
    
    RAISE NOTICE 'Role diupdate menjadi super_admin untuk: %', target_email;
  ELSE
    -- Insert baru jika belum ada
    INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
    VALUES (target_user_id, default_tenant_id, 'super_admin', true);
    
    RAISE NOTICE 'Super admin berhasil dibuat untuk: %', target_email;
  END IF;
END $$;

-- 3. Verifikasi hasil
SELECT 
  au.email,
  au.id as user_id,
  tu.role,
  t.name as tenant_name,
  t.slug as tenant_slug,
  tu.created_at,
  tu.updated_at
FROM auth.users au
LEFT JOIN tenant_users tu ON au.id = tu.user_id
LEFT JOIN tenants t ON tu.tenant_id = t.id
WHERE au.email = '${email}'
ORDER BY tu.created_at DESC;

-- 4. Lihat semua super admin
SELECT 
  au.email,
  au.created_at as user_created,
  tu.role,
  t.name as tenant_name,
  tu.created_at as role_created
FROM tenant_users tu
JOIN auth.users au ON tu.user_id = au.id
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role = 'super_admin'
ORDER BY tu.created_at DESC;`;
    
    setSqlScript(script);
  }, [email]);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/debug/list-users?email=${email}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }
      
      // Transform data to match our interface
      const transformedStatus: UserStatus = {
        exists: data.exists,
        user: data.user,
        roles: data.roles || [],
        is_super_admin: data.is_super_admin || false
      };
      
      setStatus(transformedStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      alert('SQL script copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Supabase Super Admin Setup
          </h1>
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email untuk di-setup sebagai Super Admin:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="anjarbdn@gmail.com"
            />
          </div>

          <div className="mb-8">
            <button
              onClick={checkStatus}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Check User Status'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {status && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Status:</h3>
              
              {status.exists ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 mb-2">
                    <strong>User ditemukan!</strong> Email: {status.user?.email}
                  </p>
                  <p className="text-green-700 mb-2">
                    User ID: {status.user?.id}
                  </p>
                  <p className="text-green-700 mb-2">
                    Created: {status.user?.created_at ? new Date(status.user.created_at).toLocaleString() : 'N/A'}
                  </p>
                  
                  {status.roles && status.roles.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Roles:</h4>
                      {status.roles.map((role, index) => (
                        <div key={index} className="mb-2 p-2 bg-white rounded border">
                          <p className="text-sm">
                            <strong>Role:</strong> <span className={role.role === 'super_admin' ? 'text-green-600 font-semibold' : 'text-gray-600'}>{role.role}</span>
                          </p>
                          <p className="text-sm">
                            <strong>Tenant:</strong> {role.tenants.name} ({role.tenants.slug})
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-orange-600 mt-2">
                      User belum memiliki role di tenant manapun.
                    </p>
                  )}
                  
                  {status.is_super_admin && (
                    <p className="text-green-600 font-semibold mt-2">
                      ✓ User sudah memiliki role Super Admin!
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800">
                    <strong>User tidak ditemukan!</strong> Email {email} belum terdaftar di sistem.
                  </p>
                  <p className="text-yellow-700 mt-2">
                    User perlu register terlebih dahulu melalui halaman register, atau Anda bisa membuatnya langsung di Supabase Dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cara Setup Super Admin di Supabase:
            </h3>
            
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
              <li>Buka Supabase Dashboard (https://app.supabase.com)</li>
              <li>Pilih project Anda</li>
              <li>Klik menu <strong>SQL Editor</strong></li>
              <li>Copy script SQL di bawah ini</li>
              <li>Paste di SQL Editor</li>
              <li>Klik tombol <strong>Run</strong></li>
              <li>Refresh halaman ini untuk cek hasilnya</li>
            </ol>

            <div className="bg-gray-900 rounded-md p-4 relative">
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Copy
              </button>
              <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
                {sqlScript}
              </pre>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Catatan Penting:</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li>Script ini akan membuat tenant default dengan nama "Default Journal" jika belum ada</li>
              <li>User akan di-setup sebagai super_admin di tenant tersebut</li>
              <li>Jika user sudah memiliki role lain, role akan diupdate menjadi super_admin</li>
              <li>Untuk anjarfc27@gmail.com, pastikan user ini tidak di-setup sebagai super_admin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}