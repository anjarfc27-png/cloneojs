# Panduan Setup OJS Multi-Tenant dengan Next.js

## Prerequisites

- Node.js 18+ dan npm/yarn
- Akun Supabase (gratis)
- Git (opsional)

## Langkah-langkah Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Buka SQL Editor di dashboard Supabase
3. Copy dan paste seluruh isi file `supabase/schema.sql`
4. Jalankan SQL script tersebut
5. Catat URL dan API keys dari project settings

### 3. Setup Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Cara mendapatkan credentials:**
- Buka Supabase Dashboard → Project Settings → API
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (jaga kerahasiaannya!)

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 5. Setup User Pertama (Super Admin)

Setelah database schema dibuat, Anda perlu membuat user pertama secara manual:

1. Daftar melalui halaman `/register`
2. Setelah terdaftar, buka Supabase Dashboard → Authentication → Users
3. Catat `user_id` dari user yang baru dibuat
4. Buka SQL Editor dan jalankan query berikut (ganti `USER_ID` dengan user_id yang sebenarnya):

```sql
-- Buat tenant pertama
INSERT INTO tenants (name, slug, description, is_active)
VALUES ('Default Tenant', 'default', 'Tenant default', true)
RETURNING id;

-- Catat tenant_id yang dihasilkan, lalu:
-- Ganti TENANT_ID dan USER_ID dengan nilai yang sesuai

INSERT INTO tenant_users (user_id, tenant_id, role, is_active)
VALUES ('USER_ID', 'TENANT_ID', 'super_admin', true);
```

## Struktur Project

```
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── register/
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── submissions/      # Submission components
│   └── settings/         # Settings components
├── lib/                  # Utility libraries
│   └── supabase/         # Supabase client setup
├── supabase/             # Database schema
│   └── schema.sql        # Database schema SQL
└── types/                # TypeScript type definitions
```

## Fitur yang Tersedia

### ✅ Authentication
- Login/Register dengan Supabase Auth
- Session management
- Protected routes

### ✅ Multi-Tenant
- Multiple journals per tenant
- Role-based access control
- Tenant isolation

### ✅ Submission Workflow
- Create new submission
- Draft management
- Status tracking

### ✅ Peer Review
- Review assignments
- Review status tracking
- Multiple review rounds

### ✅ Publishing
- Article management
- Published articles listing
- View/download tracking

## Development

### Menambahkan Fitur Baru

1. Buat komponen di folder `components/`
2. Buat halaman di folder `app/`
3. Update database schema jika perlu (di `supabase/schema.sql`)
4. Update types di `types/database.ts`

### Database Migrations

Untuk perubahan schema:
1. Update `supabase/schema.sql`
2. Jalankan SQL di Supabase SQL Editor
3. Update TypeScript types jika perlu

## Production Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Tambahkan environment variables
4. Deploy!

### Environment Variables untuk Production

Pastikan semua environment variables sudah di-set di platform deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (hanya untuk server-side)

## Troubleshooting

### Error: "Invalid API key"
- Pastikan environment variables sudah benar
- Cek apakah key yang digunakan adalah anon key (bukan service role key untuk client)

### Error: "relation does not exist"
- Pastikan schema SQL sudah dijalankan di Supabase
- Cek apakah semua tabel sudah dibuat

### Error: "Row Level Security policy violation"
- Pastikan RLS policies sudah dibuat
- Cek apakah user sudah terdaftar di `tenant_users`

## Security Notes

1. **Jangan commit `.env.local`** - sudah ada di `.gitignore`
2. **Service Role Key** - hanya gunakan di server-side, jangan expose ke client
3. **RLS Policies** - pastikan Row Level Security sudah diaktifkan
4. **API Keys** - gunakan anon key untuk client-side, service role hanya untuk server

## Support

Jika ada pertanyaan atau masalah, silakan buat issue atau hubungi developer.

