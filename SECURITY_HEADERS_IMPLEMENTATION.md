# Security Headers Implementation

## Overview
Security headers telah diimplementasikan untuk meningkatkan keamanan aplikasi OJS Super Admin.

## Implementation Details

### 1. Security Headers Utility (`lib/security/headers.ts`)
Utility untuk menerapkan security headers pada Next.js responses:
- **Content Security Policy (CSP)**: Mencegah XSS attacks
- **X-Frame-Options**: Mencegah clickjacking
- **X-Content-Type-Options**: Mencegah MIME type sniffing
- **Referrer-Policy**: Mengontrol informasi referrer
- **Permissions-Policy**: Mengontrol fitur browser
- **Strict-Transport-Security (HSTS)**: Memaksa HTTPS di production
- **X-XSS-Protection**: Enable XSS filter (legacy)
- **X-DNS-Prefetch-Control**: Mengontrol DNS prefetching

### 2. Middleware Integration (`lib/supabase/middleware.ts`)
Security headers diterapkan di middleware untuk semua routes:
- Skip untuk API routes (`/api/*`)
- Skip untuk static files (`/_next/*`, `/static/*`, assets)
- Applied untuk semua pages

### 3. Next.js Config (`next.config.js`)
Security headers juga dikonfigurasi di Next.js config:
- Applied untuk semua routes (`/:path*`)
- Headers: X-DNS-Prefetch-Control, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

## CSP Policy

Default CSP policy:
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co;
frame-src 'self' https://*.supabase.co;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self';
upgrade-insecure-requests;
```

### CSP Directives Explanation:
- **default-src 'self'**: Hanya allow resources dari same origin
- **script-src**: Allow scripts dari self, CDN, dan inline (untuk Next.js)
- **style-src**: Allow styles dari self, inline (untuk Tailwind), dan Google Fonts
- **font-src**: Allow fonts dari self, Google Fonts, dan data URIs
- **img-src**: Allow images dari self, data URIs, HTTPS, dan blob
- **connect-src**: Allow connections ke Supabase
- **frame-src**: Allow frames dari self dan Supabase
- **object-src 'none'**: Block all object elements
- **base-uri 'self'**: Restrict base tag
- **form-action 'self'**: Restrict form submissions
- **frame-ancestors 'self'**: Prevent framing
- **upgrade-insecure-requests**: Upgrade HTTP to HTTPS

## Security Headers Details

### X-Frame-Options
- Value: `SAMEORIGIN`
- Purpose: Mencegah clickjacking attacks
- Effect: Page hanya bisa di-embed di same origin

### X-Content-Type-Options
- Value: `nosniff`
- Purpose: Mencegah MIME type sniffing
- Effect: Browser tidak akan menebak MIME type

### Referrer-Policy
- Value: `strict-origin-when-cross-origin`
- Purpose: Mengontrol informasi referrer
- Effect: Referrer hanya dikirim untuk same-origin requests

### Permissions-Policy
- Value: `camera=(), microphone=(), geolocation=(), interest-cohort=()`
- Purpose: Mengontrol fitur browser
- Effect: Disable camera, microphone, geolocation, dan FLoC

### Strict-Transport-Security (HSTS)
- Value: `max-age=31536000; includeSubDomains; preload`
- Purpose: Memaksa HTTPS
- Effect: Browser akan selalu menggunakan HTTPS untuk 1 tahun
- Note: Hanya aktif di production

### X-XSS-Protection
- Value: `1; mode=block`
- Purpose: Enable XSS filter (legacy)
- Effect: Browser akan block XSS attacks

### X-DNS-Prefetch-Control
- Value: `on`
- Purpose: Mengontrol DNS prefetching
- Effect: Browser akan prefetch DNS untuk performance

## Customization

### Custom CSP Policy
CSP policy bisa dikustomisasi melalui:
1. Site Settings (`site_settings` table)
2. Environment variables
3. Direct modification di `lib/security/headers.ts`

### Disable Security Headers
Untuk disable security headers (development only):
```typescript
applySecurityHeaders(response, {
  enableCSP: false,
  enableHSTS: false,
  enableXSSProtection: false,
})
```

## Testing

### Test CSP Headers
1. Open browser DevTools
2. Go to Network tab
3. Check response headers
4. Verify CSP header is present

### Test CSP Violations
1. Open browser DevTools
2. Go to Console tab
3. Look for CSP violation messages
4. Adjust CSP policy if needed

### Test Other Headers
1. Use browser extension (e.g., Security Headers)
2. Use online tool (e.g., securityheaders.com)
3. Check response headers manually

## Notes

1. **CSP and Next.js**: Next.js requires `unsafe-inline` untuk scripts dan styles karena menggunakan inline scripts/styles
2. **CSP and Tailwind**: Tailwind menggunakan inline styles, sehingga perlu `unsafe-inline` untuk styles
3. **CSP and Supabase**: Supabase requires connections ke `*.supabase.co`, sehingga perlu di-allow di `connect-src`
4. **HSTS**: HSTS hanya aktif di production untuk menghindari issues di development
5. **Performance**: Security headers tidak significantly impact performance

## Future Improvements

1. **CSP Reporting**: Implement CSP reporting endpoint untuk monitoring violations
2. **Dynamic CSP**: Fetch CSP policy dari database untuk customization
3. **CSP Nonce**: Implement CSP nonce untuk lebih strict CSP policy
4. **Security Testing**: Add automated security testing untuk headers
5. **Headers Monitoring**: Monitor security headers violations

---

**Last Updated**: Security Headers Implementation Completed
**Status**: ✅ Implemented and Ready for Testing

