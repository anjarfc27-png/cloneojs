# 🔍 Panduan Check Database Supabase

Saya sudah membuat 2 cara untuk check database secara langsung tanpa perlu akses manual ke Supabase Dashboard.

## 🚀 Cara 1: API Endpoint (Paling Mudah)

### Langkah 1: Buka Browser

Buka endpoint berikut di browser atau Postman:

```
http://localhost:3000/api/debug/check-database?email=anjarbdn@gmail.com
```

Atau untuk email lain:
```
http://localhost:3000/api/debug/check-database?email=email@example.com
```

### Langkah 2: Lihat Hasil

Response akan menampilkan:
- ✅ User info (ID, email, created_at, last_sign_in)
- ✅ Super Admin role definition
- ✅ Role assignments (user_role_assignments)
- ✅ Tenant users (old structure)
- ✅ Diagnosis lengkap
- ✅ SQL fix jika diperlukan

### Contoh Response:

```json
{
  "success": true,
  "user": {
    "id": "655ca435-ea20-4dea-817e-4ae1bdf8e86c",
    "email": "anjarbdn@gmail.com",
    "created_at": "2025-11-09T16:18:37.120918Z",
    "last_sign_in_at": "2025-11-11T10:30:00.000Z"
  },
  "superAdminRole": {
    "id": "1755761c-01dd-4040-b9b7-f6f103158979",
    "role_key": "super_admin",
    "name": "Super Admin"
  },
  "roleAssignments": {
    "superAdmin": [...],
    "count": 2
  },
  "diagnosis": {
    "hasSuperAdminRole": true,
    "hasActiveSuperAdminAssignment": true,
    "isSuperAdmin": true
  },
  "fixNeeded": {
    "needsRoleAssignment": false,
    "needsTenantUser": false
  },
  "sqlFix": {
    "addRoleAssignment": null,
    "addTenantUser": null
  }
}
```

## 🖥️ Cara 2: Terminal Script (Lebih Detail)

### Langkah 1: Pastikan Server Running

```bash
npm run dev
```

### Langkah 2: Jalankan Script

Di terminal baru (PowerShell atau CMD):

```bash
npm run check-user anjarbdn@gmail.com
```

Atau dengan tsx langsung:

```bash
npx tsx scripts/check-user-role.ts anjarbdn@gmail.com
```

### Langkah 3: Lihat Output

Script akan menampilkan:
- ✅ User info lengkap
- ✅ Super Admin role check
- ✅ Role assignments detail
- ✅ Tenant users detail
- ✅ Diagnosis lengkap
- ✅ SQL fix jika diperlukan

### Contoh Output:

```
🔍 Checking role for: anjarbdn@gmail.com

📋 Step 1: Finding user in auth...
✅ User found:
   ID: 655ca435-ea20-4dea-817e-4ae1bdf8e86c
   Email: anjarbdn@gmail.com
   Created: 2025-11-09T16:18:37.120918Z
   Last Sign In: 2025-11-11T10:30:00.000Z
   Email Confirmed: Yes

📋 Step 2: Checking super_admin role...
✅ Super Admin Role found:
   ID: 1755761c-01dd-4040-b9b7-f6f103158979
   Key: super_admin
   Name: Super Admin

📋 Step 3: Checking user_role_assignments...
📊 Role Assignments: 2 active
   1. Assignment ID: 3cac8333-efd2-423d-a13d-ccbcba19201e
      Tenant ID: 166d32e6-d986-4ab8-b12c-23d248e2d944
      Journal ID: N/A
      Created: 2025-11-09T16:34:58.03601+00:00

📋 Step 4: Checking tenant_users (old structure)...
📊 Tenant Users: 2 active
   1. Tenant User ID: 02a5dd67-4883-4396-8b3e-9743ecc8c280
      Tenant ID: 166d32e6-d986-4ab8-b12c-23d248e2d944
      Role: super_admin
      Created: 2025-11-09T16:34:58.03601+00:00

📋 Step 5: Diagnosis...
   Has super_admin role definition: ✅
   Has active role assignment: ✅
   Has tenant_users entry: ✅
   Is Super Admin: ✅ YES

✅ User is properly configured as super admin!
```

## 🔧 Jika User Tidak Punya Role

Jika diagnosis menunjukkan `isSuperAdmin: false`, endpoint/script akan memberikan SQL fix:

### SQL Fix untuk Role Assignment:

```sql
-- Add super admin role assignment
INSERT INTO user_role_assignments (user_id, role_id, tenant_id, is_active)
VALUES (
  'USER_ID_HERE',
  'ROLE_ID_HERE',
  (SELECT id FROM tenants LIMIT 1), -- Replace with actual tenant_id
  true
)
ON CONFLICT DO NOTHING;
```

### SQL Fix untuk Tenant User:

```sql
-- Add tenant user (old structure)
INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
VALUES (
  'USER_ID_HERE',
  (SELECT id FROM tenants LIMIT 1), -- Replace with actual tenant_id
  'super_admin',
  true
)
ON CONFLICT DO NOTHING;
```

## 📝 Cara Menggunakan SQL Fix

1. **Copy SQL fix** dari response endpoint atau script output
2. **Buka Supabase Dashboard** → SQL Editor
3. **Paste SQL** dan ganti placeholder:
   - `USER_ID_HERE` → User ID dari response
   - `ROLE_ID_HERE` → Role ID dari response
   - `(SELECT id FROM tenants LIMIT 1)` → Ganti dengan tenant_id yang sebenarnya
4. **Run SQL**
5. **Verify** dengan menjalankan check lagi

## 🎯 Quick Test

Setelah fix, test lagi:

1. **API**: `http://localhost:3000/api/debug/check-database?email=anjarbdn@gmail.com`
2. **Script**: `npm run check-user anjarbdn@gmail.com`
3. **Expected**: `isSuperAdmin: true`

## ⚠️ Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"

Pastikan `.env.local` memiliki:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Error: "User not found"

Pastikan email yang digunakan sudah terdaftar di Supabase Auth.

### Error: "super_admin role not found"

Jalankan migration `004_refactor_schema_for_super_admin.sql` di Supabase Dashboard.

---

**Silakan coba salah satu cara di atas untuk check database!**

