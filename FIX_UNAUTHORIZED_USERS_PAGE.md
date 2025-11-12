# 🔧 Fix Unauthorized Error - Users Management Page

## 🔍 Masalah

Halaman `/admin/users` menampilkan error **"Unauthorized"** dan "Total: 0 pengguna".

## 📝 Catatan Penting

**Untuk penggunaan di Indonesia dengan banyak super admin:**
- ✅ **Boleh ada banyak users dengan role super_admin** (melalui `user_role_assignments`)
- ❌ **Tidak boleh ada duplicate role definition** (hanya 1 role dengan `role_key = 'super_admin'` di table `roles`)
- Migration 005 akan cleanup duplicate role definitions, tapi tetap support banyak super admin users

## ✅ Perbaikan yang Sudah Dilakukan

1. **Update `checkSuperAdmin()`** - Sekarang menggunakan admin client untuk bypass RLS saat check role
2. **Update `requireSuperAdmin()`** - Sekarang menggunakan admin client untuk bypass RLS saat check role

## 🔍 Debugging Steps

### 1. Check Apakah User Punya Super Admin Role

Cek di database apakah user yang login punya super_admin role:

#### Option A: Check via Supabase Dashboard

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan query berikut (ganti `YOUR_USER_EMAIL` dengan email user yang login):

```sql
-- Check user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_USER_EMAIL';

-- Check super_admin role di user_role_assignments (new structure)
SELECT ura.*, r.role_key, r.name
FROM user_role_assignments ura
JOIN roles r ON r.id = ura.role_id
WHERE ura.user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL')
  AND r.role_key = 'super_admin'
  AND ura.is_active = true;

-- Check super_admin role di tenant_users (old structure)
SELECT * FROM tenant_users
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL')
  AND role = 'super_admin'
  AND is_active = true;
```

#### Option B: Check via API Route

Buat file `app/api/debug/check-user-role/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check new structure
    const { data: superAdminRole } = await adminClient
      .from('roles')
      .select('id')
      .eq('role_key', 'super_admin')
      .maybeSingle()

    let roleAssignments = null
    if (superAdminRole) {
      const { data } = await adminClient
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_id', superAdminRole.id)
        .eq('is_active', true)
      
      roleAssignments = data
    }

    // Check old structure
    const { data: tenantUsers } = await adminClient
      .from('tenant_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      superAdminRole,
      roleAssignments,
      tenantUsers,
      isSuperAdmin: (roleAssignments && roleAssignments.length > 0) || (tenantUsers && tenantUsers.length > 0),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

Lalu akses: `http://localhost:3000/api/debug/check-user-role`

### 2. Setup Super Admin Role

Jika user belum punya super_admin role, setup dengan salah satu cara berikut:

#### Option A: Via SQL (Recommended)

Jalankan di Supabase SQL Editor:

```sql
-- 1. Get user ID
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  -- Get user ID (ganti email dengan email user Anda)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'YOUR_USER_EMAIL';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get super_admin role ID
  SELECT id INTO v_role_id FROM roles WHERE role_key = 'super_admin';
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found. Run migration first.';
  END IF;

  -- Insert into user_role_assignments (new structure)
  INSERT INTO user_role_assignments (user_id, role_id, is_active)
  VALUES (v_user_id, v_role_id, true)
  ON CONFLICT DO NOTHING;

  -- Also insert into tenant_users (old structure for backward compatibility)
  INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
  VALUES (v_user_id, NULL, 'super_admin', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Super admin role assigned successfully';
END $$;
```

#### Option B: Via API Route

Buat file `app/api/debug/setup-super-admin/route.ts` (jika belum ada):

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get user ID
    const { data: users } = await adminClient.auth.admin.listUsers()
    const user = users?.users.find((u: any) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get super_admin role ID
    const { data: superAdminRole } = await adminClient
      .from('roles')
      .select('id')
      .eq('role_key', 'super_admin')
      .maybeSingle()

    if (!superAdminRole) {
      return NextResponse.json({ error: 'Super admin role not found' }, { status: 404 })
    }

    // Insert into user_role_assignments
    const { error: uraError } = await adminClient
      .from('user_role_assignments')
      .insert({
        user_id: user.id,
        role_id: superAdminRole.id,
        is_active: true,
      })
      .select()
      .single()

    // Also insert into tenant_users (backward compatibility)
    const { error: tuError } = await adminClient
      .from('tenant_users')
      .insert({
        user_id: user.id,
        tenant_id: null,
        role: 'super_admin',
        is_active: true,
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      message: 'Super admin role assigned',
      user: {
        id: user.id,
        email: user.email,
      },
      errors: {
        user_role_assignments: uraError?.message,
        tenant_users: tuError?.message,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

Lalu POST ke: `http://localhost:3000/api/debug/setup-super-admin` dengan body:
```json
{
  "email": "your-email@example.com"
}
```

### 3. Check Console Logs

Buka browser console (F12) dan check logs:
- `[checkSuperAdmin]` - untuk melihat apakah authorization check berhasil
- `[getUsers]` - untuk melihat apakah ada error saat fetch users

### 4. Check Terminal Logs

Check terminal dimana dev server berjalan untuk melihat server-side logs:
- `[checkSuperAdmin]` logs
- `[getUsers]` logs
- Error messages

## 🎯 Common Issues & Solutions

### Issue 1: User Tidak Punya Super Admin Role

**Solution**: Setup super admin role menggunakan salah satu method di atas.

### Issue 2: RLS Policies Blocking

**Solution**: Sudah diperbaiki dengan menggunakan admin client di `checkSuperAdmin()`.

### Issue 3: SUPABASE_SERVICE_ROLE_KEY Tidak Ada

**Solution**: 
1. Check `.env.local` apakah ada `SUPABASE_SERVICE_ROLE_KEY`
2. Restart dev server setelah menambahkan key
3. Lihat [SETUP_SERVICE_ROLE_KEY.md](./SETUP_SERVICE_ROLE_KEY.md)

### Issue 4: Cookie/Session Issue

**Solution**:
1. Logout dan login lagi
2. Clear browser cookies
3. Check apakah middleware berfungsi dengan baik

## ✅ Testing

Setelah setup super admin role:

1. **Logout dan login lagi**
2. **Akses `/admin/users`**
3. **Check apakah error "Unauthorized" hilang**
4. **Check apakah users list muncul**

## 📝 Notes

- Pastikan migration `004_refactor_schema_for_super_admin.sql` sudah dijalankan
- Pastikan table `roles` dan `user_role_assignments` sudah ada
- Pastikan ada role dengan `role_key = 'super_admin'` di table `roles`

---

**Jika masih ada masalah, check console logs dan terminal logs untuk detail error.**

