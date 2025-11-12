# Setup Environment Variables (.env.local)

## ✅ Nama File yang Benar

Nama file harus: **`.env.local`** (dengan titik di depan)

## 📝 Format File

File `.env.local` harus berada di **root project** (sama level dengan `package.json`).

Format isinya:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cqaefitmerciqcneksqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYWVmaXRtZXJjaXFjbmVrc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDI3NzEsImV4cCI6MjA3ODI3ODc3MX0.B04UjcIfxShFsdwBFWLDHJYdEUbMXjaNs9iDoIPQ5kM
```

## ⚠️ Aturan Penting

1. **Nama file**: `.env.local` (dengan titik di depan, tanpa ekstensi lain)
2. **Tidak ada spasi** sebelum atau sesudah tanda `=`
3. **Tidak pakai tanda kutip** (`"` atau `'`) kecuali nilai mengandung spasi
4. **Tidak ada baris kosong** yang tidak perlu di awal/akhir
5. **Setiap variabel** di baris terpisah

## ❌ Format yang SALAH

```env
# SALAH - ada spasi
NEXT_PUBLIC_SUPABASE_URL = https://...
NEXT_PUBLIC_SUPABASE_URL= https://...
NEXT_PUBLIC_SUPABASE_URL =https://...

# SALAH - pakai tanda kutip
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_URL='https://...'

# SALAH - nama file salah
env.local
.env
.env.local.txt
```

## ✅ Format yang BENAR

```env
NEXT_PUBLIC_SUPABASE_URL=https://cqaefitmerciqcneksqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYWVmaXRtZXJjaXFjbmVrc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDI3NzEsImV4cCI6MjA3ODI3ODc3MX0.B04UjcIfxShFsdwBFWLDHJYdEUbMXjaNs9iDoIPQ5kM
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🔧 Cara Membuat File .env.local

### Di Windows (File Explorer):
1. Buka folder project di File Explorer
2. Klik kanan → New → Text Document
3. Rename menjadi `.env.local` (pastikan hapus ekstensi `.txt`)
4. Windows akan tanya "Are you sure you want to change the extension?" → Klik **Yes**
5. Buka dengan Notepad atau VS Code
6. Copy-paste isi dari `.env.local.example`

### Di VS Code:
1. Klik kanan di root project (folder "OJS cloning")
2. New File
3. Ketik: `.env.local`
4. Paste isi dari `.env.local.example`

### Di Terminal (PowerShell):
```powershell
cd "D:\OJS cloning"
New-Item -Path ".env.local" -ItemType File
notepad .env.local
# Lalu paste isi file
```

## ✅ Verifikasi File Sudah Benar

Setelah membuat file, cek:

1. **Nama file**: Harus `.env.local` (bukan `.env.local.txt` atau lainnya)
2. **Lokasi**: Harus di root project (sama level dengan `package.json`)
3. **Isi**: Harus ada 3 baris:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ WAJIB untuk Server Actions)

## 🔄 Setelah Membuat/Mengubah .env.local

**WAJIB RESTART DEV SERVER:**

```bash
# Stop server (Ctrl+C)
npm run dev
```

## 🧪 Test Apakah Env Vars Terbaca

Setelah restart, buka browser console (F12) dan coba login. Console harus menampilkan:

```
✅ [LOGIN] Supabase client created successfully
```

Jika muncul error "Missing Supabase environment variables", berarti:
- File `.env.local` tidak ada, atau
- Format file salah, atau
- Dev server belum di-restart

