/**
 * Security Headers Utility
 * 
 * Provides security headers for Next.js responses including:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 * - Strict-Transport-Security (HSTS)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Default CSP policy
 * Can be customized via site_settings
 */
const defaultCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com", // Allow inline scripts for Next.js
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow inline styles for Tailwind
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
  "frame-src 'self' https://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ')

/**
 * Security headers configuration
 */
interface SecurityHeadersConfig {
  csp?: string
  enableCSP?: boolean
  enableHSTS?: boolean
  enableXSSProtection?: boolean
}

/**
 * Apply security headers to NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const {
    csp = defaultCSP,
    enableCSP = true,
    enableHSTS = process.env.NODE_ENV === 'production',
    enableXSSProtection = true,
  } = config

  // Content Security Policy
  if (enableCSP && csp) {
    response.headers.set('Content-Security-Policy', csp)
  }

  // X-Frame-Options: Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Control browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // X-XSS-Protection: Enable XSS filter (legacy, but still useful)
  if (enableXSSProtection) {
    response.headers.set('X-XSS-Protection', '1; mode=block')
  }

  // Strict-Transport-Security: Force HTTPS in production
  if (enableHSTS) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // X-DNS-Prefetch-Control: Control DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  return response
}

/**
 * Get CSP policy from site settings or use default
 * This function can be extended to fetch from database
 */
export function getCSPPolicy(customPolicy?: string | null): string {
  if (customPolicy) {
    return customPolicy
  }
  return defaultCSP
}

/**
 * Create security headers middleware
 */
export function createSecurityHeadersMiddleware(
  config: SecurityHeadersConfig = {}
) {
  return (response: NextResponse, request: NextRequest): NextResponse => {
    // Skip security headers for API routes (handled by API routes themselves)
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return response
    }

    // Skip security headers for static files
    if (
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/static/') ||
      request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/)
    ) {
      return response
    }

    return applySecurityHeaders(response, config)
  }
}

/**
 * Report-only CSP for development
 * Allows testing CSP without breaking the application
 */
export function getReportOnlyCSP(): string {
  return defaultCSP.replace(
    "default-src 'self'",
    "default-src 'self'; report-uri /api/csp-report"
  )
}

