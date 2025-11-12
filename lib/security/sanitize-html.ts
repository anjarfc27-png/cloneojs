/**
 * HTML Sanitizer
 * 
 * Sanitizes HTML content to prevent XSS attacks.
 * Only allows whitelisted tags and attributes.
 * 
 * This is a server-side utility. Never trust client-side sanitization.
 */

/**
 * Allowed HTML tags (whitelist)
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
]

/**
 * Allowed attributes per tag
 */
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  table: ['border', 'cellpadding', 'cellspacing'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
}

/**
 * Sanitize HTML content
 * 
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Remove script tags and content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove style tags and content (optional - can be allowed if needed)
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  // Remove event handlers (onclick, onload, etc.)
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  
  // Remove javascript: protocol
  html = html.replace(/javascript:/gi, '')
  
  // Remove data: URLs that might contain scripts
  html = html.replace(/data:text\/html/gi, '')
  
  // Remove iframe, embed, object tags (security risk)
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  html = html.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  
  // Remove form tags (prevent form injection)
  html = html.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
  
  // Remove input, textarea, select, button tags (prevent form injection)
  html = html.replace(/<(input|textarea|select|button)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')

  // Basic tag whitelist (simple implementation)
  // For production, consider using a library like DOMPurify or sanitize-html
  // This is a basic implementation that handles common cases
  
  // Remove any tags not in whitelist (basic regex approach)
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
  html = html.replace(tagRegex, (match, tagName) => {
    const lowerTag = tagName.toLowerCase()
    if (ALLOWED_TAGS.includes(lowerTag)) {
      // Keep the tag but remove dangerous attributes
      let cleanTag = match
      
      // Remove dangerous attributes
      cleanTag = cleanTag.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      cleanTag = cleanTag.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
      cleanTag = cleanTag.replace(/javascript:/gi, '')
      
      // Allow only whitelisted attributes for this tag
      const allowedAttrs = ALLOWED_ATTRIBUTES[lowerTag] || []
      if (allowedAttrs.length > 0) {
        const attrRegex = /\s+([a-z-]+)\s*=\s*["']([^"']*)["']/gi
        cleanTag = cleanTag.replace(attrRegex, (attrMatch, attrName, attrValue) => {
          if (allowedAttrs.includes(attrName.toLowerCase())) {
            // Sanitize attribute value
            const cleanValue = attrValue
              .replace(/javascript:/gi, '')
              .replace(/on\w+/gi, '')
            return ` ${attrName}="${cleanValue}"`
          }
          return ''
        })
      }
      
      return cleanTag
    }
    // Remove tag if not in whitelist
    return ''
  })

  return html.trim()
}

/**
 * Strip all HTML tags (for plain text extraction)
 */
export function stripHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}



