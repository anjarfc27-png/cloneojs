# Test Service Role Key

## ✅ Format File .env.local Sudah Benar

File `.env.local` Anda sudah memiliki format yang benar:

1. ✅ `NEXT_PUBLIC_SUPABASE_URL` - Ada
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Ada  
3. ✅ `SUPABASE_SERVICE_ROLE_KEY` - Ada (ini yang penting!)

## 🔍 Verifikasi Service Role Key

Service Role Key Anda terlihat valid:
- Format JWT (dimulai dengan `eyJ...`)
- Panjang key sesuai (JWT token)
- Dari payload JWT, terlihat `"role":"service_role"` yang benar

## 🧪 Test Service Role Key

### Cara 1: Test dengan Server Action

1. **Restart dev server** (jika belum):
```bash
# Stop server (Ctrl+C)
npm run dev
```

2. **Buka browser** dan akses:
```
http://localhost:3000/admin/settings
```

3. **Check console** (F12) untuk error:
   - Jika tidak ada error "Missing SUPABASE_SERVICE_ROLE_KEY", berarti key sudah terbaca
   - Jika ada error, check format key

### Cara 2: Test dengan API Route

Buat file test sederhana:

```typescript
// app/api/test-service-role/route.ts
import { createAdminClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const client = createAdminClient()
    const { data, error } = await client
      .from('sites')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Service Role Key is working!',
      data 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      hint: 'Check if SUPABASE_SERVICE_ROLE_KEY is set correctly in .env.local'
    }, { status: 500 })
  }
}
```

Lalu akses: `http://localhost:3000/api/test-service-role`

### Cara 3: Check Error di Terminal

Jika Service Role Key tidak ada atau salah, akan muncul error saat start server:

```
Error: Missing SUPABASE_SERVICE_ROLE_KEY environment variable.
```

Jika error ini muncul, berarti:
- Key belum ditambahkan ke `.env.local`, atau
- Format key salah, atau
- Server belum di-restart setelah menambahkan key

## ✅ Checklist

- [x] File `.env.local` ada di root project
- [x] Format file benar (tidak ada spasi, tidak pakai tanda kutip)
- [x] `NEXT_PUBLIC_SUPABASE_URL` ada
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ada
- [x] `SUPABASE_SERVICE_ROLE_KEY` ada
- [ ] Dev server sudah di-restart setelah menambahkan key
- [ ] Test Server Actions berfungsi
- [ ] Tidak ada error di console/terminal

## 🚀 Next Steps

Setelah Service Role Key berfungsi:

1. **Test Server Actions**:
   - Buka `/admin/settings`
   - Coba update sebuah setting
   - Verify tidak ada error

2. **Test Audit Logging**:
   - Update setting
   - Check audit log di database:
   ```sql
   SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;
   ```

3. **Test Super Admin Access**:
   - Verify akses ke `/admin/dashboard`
   - Verify akses ke semua admin pages

## 🔒 Security Reminder

- ✅ File `.env.local` tidak di-commit ke Git (sudah ada di `.gitignore`)
- ✅ Service Role Key tidak di-share ke publik
- ✅ Key hanya digunakan di server-side (Server Actions/API routes)
- ✅ Key bypass RLS, jadi pastikan authorization checks di Server Actions

## 📚 Reference

- `SETUP_SERVICE_ROLE_KEY.md` - Panduan lengkap setup Service Role Key
- `ENV_SETUP.md` - Panduan setup environment variables
- `lib/db/supabase-admin.ts` - Admin client yang menggunakan Service Role Key



