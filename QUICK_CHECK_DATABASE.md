# ✅ Quick Check Database - Solusi Cepat

Saya sudah membuat **API endpoint** yang bisa check database langsung tanpa perlu akses manual ke Supabase Dashboard.

## 🚀 Cara Menggunakan (Paling Mudah)

### Step 1: Pastikan Server Running

```bash
npm run dev
```

### Step 2: Buka Browser

Buka endpoint berikut:

```
http://localhost:3000/api/debug/check-database?email=anjarbdn@gmail.com
```

### Step 3: Lihat Hasil

Response akan menampilkan:
- ✅ **User info** (ID, email, created_at, last_sign_in)
- ✅ **Super Admin role** definition
- ✅ **Role assignments** (user_role_assignments table)
- ✅ **Tenant users** (old structure)
- ✅ **Diagnosis lengkap** (isSuperAdmin: true/false)
- ✅ **SQL fix** jika diperlukan

## 📊 Contoh Response

```json
{
  "success": true,
  "user": {
    "id": "655ca435-ea20-4dea-817e-4ae1bdf8e86c",
    "email": "anjarbdn@gmail.com",
    "created_at": "2025-11-09T16:18:37.120918Z",
    "last_sign_in_at": "2025-11-11T10:30:00.000Z",
    "email_confirmed_at": "2025-11-09T16:18:37.120918Z"
  },
  "superAdminRole": {
    "id": "1755761c-01dd-4040-b9b7-f6f103158979",
    "role_key": "super_admin",
    "name": "Super Admin"
  },
  "roleAssignments": {
    "superAdmin": [
      {
        "id": "3cac8333-efd2-423d-a13d-ccbcba19201e",
        "user_id": "655ca435-ea20-4dea-817e-4ae1bdf8e86c",
        "role_id": "1755761c-01dd-4040-b9b7-f6f103158979",
        "tenant_id": "166d32e6-d986-4ab8-b12c-23d248e2d944",
        "is_active": true
      }
    ],
    "count": 2
  },
  "tenantUsers": [
    {
      "id": "02a5dd67-4883-4396-8b3e-9743ecc8c280",
      "user_id": "655ca435-ea20-4dea-817e-4ae1bdf8e86c",
      "tenant_id": "166d32e6-d986-4ab8-b12c-23d248e2d944",
      "role": "super_admin",
      "is_active": true
    }
  ],
  "diagnosis": {
    "hasSuperAdminRole": true,
    "hasActiveSuperAdminAssignment": true,
    "hasSuperAdminInTenantUsers": true,
    "isSuperAdmin": true,
    "hasEmailConfirmed": true,
    "hasRecentSignIn": true
  },
  "fixNeeded": {
    "needsRoleAssignment": false,
    "needsTenantUser": false,
    "needsEmailConfirmation": false
  }
}
```

## 🔧 Jika `isSuperAdmin: false`

Jika diagnosis menunjukkan `isSuperAdmin: false`, response akan memberikan **SQL fix** di field `sqlFix`:

### Copy SQL Fix

1. **Copy SQL** dari response `sqlFix.addRoleAssignment` atau `sqlFix.addTenantUser`
2. **Buka Supabase Dashboard** → SQL Editor
3. **Paste SQL** dan ganti placeholder:
   - `(SELECT id FROM tenants LIMIT 1)` → Ganti dengan tenant_id yang sebenarnya
4. **Run SQL**
5. **Verify** dengan check lagi

## 🎯 Quick Test

Setelah fix, test lagi:

```
http://localhost:3000/api/debug/check-database?email=anjarbdn@gmail.com
```

**Expected**: `diagnosis.isSuperAdmin: true`

## 📝 Catatan

- ✅ Endpoint ini **bypass semua auth checks** untuk debugging
- ✅ Menggunakan **admin client** (bypass RLS)
- ✅ Bisa check **multiple users** dengan mengubah query param `email`
- ✅ Memberikan **SQL fix** otomatis jika diperlukan

---

**Silakan buka endpoint di browser untuk check database sekarang!**

