# Debug Guide: Login Issue

## Step-by-Step Debugging

### 1. Pastikan Environment Variables Sudah Di-Set

Buka `.env.local` di root project dan pastikan ada:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Test:**
```bash
# Di terminal, jalankan:
echo $NEXT_PUBLIC_SUPABASE_URL
```

Jika kosong, restart dev server setelah menambahkan env vars.

### 2. Test Login dengan Console Open

1. Buka browser dengan **Console** (F12)
2. Aktifkan **"Preserve log"** (icon kotak dengan garis diagonal)
3. Clear console (icon clear)
4. Buka `http://localhost:3000/login`
5. Isi email dan password
6. Klik "Masuk"
7. **Perhatikan console** - harus muncul log dengan prefix `[LOGIN]`

### 3. Expected Console Output (Success)

Jika login berhasil, console harus menampilkan:

```
🔵 [LOGIN] ========== LOGIN STARTED ==========
🔵 [LOGIN] Form submitted for: your@email.com
🔵 [LOGIN] Current URL: http://localhost:3000/login
🔵 [LOGIN] Env check - URL exists: true
🔵 [LOGIN] Env check - Key exists: true
🔵 [LOGIN] Creating Supabase client...
✅ [LOGIN] Supabase client created successfully
🔵 [LOGIN] Calling signInWithPassword...
🔵 [LOGIN] signInWithPassword response received
✅ [LOGIN] Login successful!
✅ [LOGIN] User ID: xxx-xxx-xxx
✅ [LOGIN] User Email: your@email.com
✅ [LOGIN] Session exists: true
✅ [LOGIN] Session access token exists: true
🔵 [LOGIN] Waiting 200ms for cookies to be set...
🔵 [LOGIN] Verifying session accessibility...
✅ [LOGIN] Session verified successfully!
🔵 [LOGIN] About to redirect to /dashboard...
🔵 [LOGIN] Executing window.location.href = "/dashboard"
✅ [LOGIN] Redirect command executed
```

### 4. Check Network Tab

1. Buka **Network** tab (F12 → Network)
2. Filter: `auth` atau `supabase`
3. Coba login
4. Cari request ke Supabase auth endpoint
5. **Check:**
   - Status: Harus `200 OK` (bukan 401, 403, 404)
   - Response: Harus ada `access_token` dan `user` object

### 5. Check Cookies

1. Buka **Application** tab (F12 → Application)
2. Klik **Cookies** → `http://localhost:3000`
3. Setelah login, harus ada cookies:
   - `sb-xxx-auth-token`
   - Cookie lain dari Supabase
4. Jika tidak ada cookies, kemungkinan:
   - Browser block cookies
   - Supabase client tidak set cookies dengan benar

### 6. Common Issues & Solutions

#### Issue: Console tidak menampilkan log `[LOGIN]`
**Solution:**
- Pastikan form submit handler terpanggil
- Cek apakah ada error di console sebelum login
- Pastikan `LoginForm` component ter-render

#### Issue: "Missing Supabase environment variables"
**Solution:**
- Pastikan `.env.local` ada di root project
- Restart dev server setelah menambah env vars
- Pastikan env vars dimulai dengan `NEXT_PUBLIC_`

#### Issue: Login berhasil tapi tidak redirect
**Solution:**
- Cek console untuk log `[LOGIN] Redirect command executed`
- Cek apakah ada error di Network tab
- Coba hard refresh (Ctrl+Shift+R)
- Cek apakah `/dashboard` route ada

#### Issue: Session tidak persist setelah refresh
**Solution:**
- Cek cookies di Application tab
- Pastikan middleware.ts sudah benar
- Cek Supabase dashboard untuk melihat session

### 7. Manual Test Script

Jalankan di browser console (setelah halaman login ter-load):

```javascript
// Test 1: Check environment variables
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌')

// Test 2: Check Supabase client
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
console.log('Supabase client:', supabase ? '✅' : '❌')

// Test 3: Check current session
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Session:', data.session ? '✅ Found' : '❌ Not found')
  console.log('Error:', error)
})
```

### 8. Jika Masih Error

Kirimkan informasi berikut:

1. **Screenshot console** (dengan "Preserve log" aktif)
2. **Screenshot Network tab** (filter: `auth` atau `supabase`)
3. **Screenshot Application tab** → Cookies
4. **Error message** yang muncul (jika ada)
5. **Status code** dari request ke Supabase (di Network tab)

## Quick Fixes

### Fix 1: Clear All & Restart
```bash
# Stop server
Ctrl+C

# Clear .next folder
rm -rf .next

# Restart
npm run dev
```

### Fix 2: Clear Browser Data
1. Buka DevTools (F12)
2. Application tab → Clear storage → Clear site data
3. Refresh halaman

### Fix 3: Check Supabase Dashboard
1. Buka Supabase Dashboard
2. Authentication → Users
3. Pastikan user ada dan aktif
4. Cek apakah email sudah verified

