# Setup SUPABASE_SERVICE_ROLE_KEY

## ⚠️ Penting: Service Role Key Diperlukan untuk Server Actions

File `lib/db/supabase-admin.ts` memerlukan `SUPABASE_SERVICE_ROLE_KEY` untuk membuat admin client yang bisa bypass RLS (Row Level Security). Tanpa key ini, Server Actions tidak akan berfungsi.

## 🔑 Cara Mendapatkan Service Role Key

### Langkah 1: Buka Supabase Dashboard

1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Login ke akun Anda
3. Pilih project Anda

### Langkah 2: Akses API Settings

1. Di sidebar kiri, klik **Settings** (ikon gear ⚙️)
2. Pilih **API** dari menu Settings
3. Scroll down ke bagian **Project API keys**

### Langkah 3: Copy Service Role Key

1. Cari bagian **service_role** key (bukan `anon` atau `public` key)
2. Klik **Reveal** atau **Copy** untuk menampilkan key
3. **⚠️ PERINGATAN**: Key ini sangat sensitif! Jangan pernah commit ke Git atau share ke publik
4. Copy seluruh key (panjang, dimulai dengan `eyJ...`)

## 📝 Menambahkan ke .env.local

### Langkah 1: Buka File .env.local

File `.env.local` berada di root project (sama level dengan `package.json`).

### Langkah 2: Tambahkan Service Role Key

Tambahkan baris berikut ke file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Contoh Lengkap:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cqaefitmerciqcneksqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYWVmaXRtZXJjaXFjbmVrc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDI3NzEsImV4cCI6MjA3ODI3ODc3MX0.B04UjcIfxShFsdwBFWLDHJYdEUbMXjaNs9iDoIPQ5kM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYWVmaXRtZXJjaXFjbmVrc3FtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcwMjc3MSwiZXhwIjoyMDc4Mjc4Nzcx.dVfXqXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
```

### ⚠️ Catatan Penting:

1. **Jangan pakai tanda kutip** (`"` atau `'`)
2. **Tidak ada spasi** sebelum atau sesudah `=`
3. **Jangan commit** file `.env.local` ke Git (sudah ada di `.gitignore`)
4. **Jangan share** key ini ke siapapun
5. **Service Role Key** berbeda dari **Anon Key**

## 🔄 Restart Dev Server

Setelah menambahkan `SUPABASE_SERVICE_ROLE_KEY`, **WAJIB restart dev server**:

```bash
# Stop server (Ctrl+C di terminal)
# Kemudian jalankan lagi:
npm run dev
```

## ✅ Verifikasi Service Role Key Terbaca

### Cara 1: Test di Browser Console

1. Buka aplikasi di browser
2. Buka Developer Tools (F12)
3. Buka Console tab
4. Coba akses halaman yang menggunakan Server Actions (misalnya `/admin/settings`)
5. Jika ada error, akan muncul di console

### Cara 2: Test dengan Server Action

Buat file test sederhana untuk memverifikasi:

```typescript
// app/test-service-role/route.ts
import { createAdminClient } from '@/lib/db/supabase-admin'

export async function GET() {
  try {
    const client = createAdminClient()
    const { data, error } = await client.from('sites').select('*').limit(1)
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ success: true, data })
  } catch (error: any) {
    return Response.json({ 
      error: error.message,
      hint: 'Check if SUPABASE_SERVICE_ROLE_KEY is set in .env.local'
    }, { status: 500 })
  }
}
```

Lalu akses `http://localhost:3000/test-service-role` di browser. Jika berhasil, akan return data sites.

### Cara 3: Check Error di Terminal

Jika `SUPABASE_SERVICE_ROLE_KEY` tidak ada, akan muncul error seperti:

```
Error: Missing SUPABASE_SERVICE_ROLE_KEY environment variable. 
This is required for server-side operations that need to bypass RLS.
```

## 🚨 Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is not defined"

**Solusi:**
1. Pastikan file `.env.local` ada di root project
2. Pastikan key ditambahkan dengan format yang benar (tidak ada spasi, tidak pakai tanda kutip)
3. Restart dev server setelah menambahkan key
4. Pastikan nama variabel benar: `SUPABASE_SERVICE_ROLE_KEY` (huruf besar semua)

### Error: "Invalid API key"

**Solusi:**
1. Pastikan Anda copy **service_role** key (bukan anon key)
2. Pastikan tidak ada spasi atau karakter tambahan saat copy-paste
3. Pastikan key masih valid (tidak expired atau di-rotate)

### Error: "Permission denied" atau "RLS policy violation"

**Solusi:**
1. Pastikan menggunakan **service_role** key (bukan anon key)
2. Service role key bypass RLS, jadi seharusnya tidak ada error RLS
3. Jika masih ada error, check RLS policies di Supabase

## 🔒 Security Best Practices

1. **Never commit** `.env.local` to Git (sudah ada di `.gitignore`)
2. **Never share** service role key publicly
3. **Never use** service role key in client-side code
4. **Only use** service role key in Server Actions or API routes
5. **Rotate** service role key periodically if compromised
6. **Use** service role key only when necessary (bypass RLS)

## 📚 Referensi

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys#service-role-key)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## ✅ Checklist

- [ ] Service role key sudah di-copy dari Supabase Dashboard
- [ ] Key sudah ditambahkan ke `.env.local`
- [ ] Format key benar (tidak ada spasi, tidak pakai tanda kutip)
- [ ] Dev server sudah di-restart
- [ ] Service role key sudah diverifikasi bekerja
- [ ] File `.env.local` tidak di-commit ke Git

## 🎯 Next Steps

Setelah service role key berhasil di-setup:

1. Test Server Actions (misalnya update site settings)
2. Verify audit logging bekerja
3. Test super admin access
4. Continue dengan migrasi modul lainnya



