/**
 * MIME Type Validator
 * 
 * Validates file MIME types to prevent dangerous file uploads.
 * Only allows whitelisted MIME types.
 */

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = {
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/rtf': ['.rtf'],
  
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  
  // Archives
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
  'application/gzip': ['.gz'],
  'application/x-tar': ['.tar'],
  
  // Audio (optional)
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  
  // Video (optional)
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/ogg': ['.ogv'],
} as const

/**
 * Allowed file extensions (derived from MIME types)
 */
export const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf',
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif',
  // Archives
  '.zip', '.rar', '.7z', '.gz', '.tar',
  // Audio
  '.mp3', '.wav', '.ogg',
  // Video
  '.mp4', '.webm', '.ogv',
] as const

/**
 * Maximum file size (in bytes)
 * Default: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Validate MIME type
 * 
 * @param mimeType - MIME type to validate
 * @returns True if MIME type is allowed
 */
export function validateMimeType(mimeType: string): boolean {
  if (!mimeType || typeof mimeType !== 'string') {
    return false
  }

  // Normalize MIME type (remove parameters)
  const normalizedMime = mimeType.split(';')[0].trim().toLowerCase()
  
  return normalizedMime in ALLOWED_MIME_TYPES
}

/**
 * Validate file extension
 * 
 * @param filename - Filename to validate
 * @returns True if extension is allowed
 */
export function validateFileExtension(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false
  }

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return ALLOWED_EXTENSIONS.includes(extension as any)
}

/**
 * Validate file size
 * 
 * @param size - File size in bytes
 * @param maxSize - Maximum file size in bytes (default: MAX_FILE_SIZE)
 * @returns True if file size is within limit
 */
export function validateFileSize(size: number, maxSize: number = MAX_FILE_SIZE): boolean {
  return size > 0 && size <= maxSize
}

/**
 * Validate file (MIME type, extension, and size)
 * 
 * @param file - File object or file info
 * @param maxSize - Maximum file size in bytes (default: MAX_FILE_SIZE)
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: {
    name: string
    type: string
    size: number
  },
  maxSize: number = MAX_FILE_SIZE
): { valid: boolean; error?: string } {
  // Validate file name
  if (!file.name || !validateFileExtension(file.name)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  // Validate MIME type
  if (!file.type || !validateMimeType(file.type)) {
    return {
      valid: false,
      error: `MIME type not allowed: ${file.type}`,
    }
  }

  // Validate file size
  if (!validateFileSize(file.size, maxSize)) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    }
  }

  // Check if extension matches MIME type
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  const expectedExtensions = ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES]
  
  if (expectedExtensions && !expectedExtensions.includes(extension as any)) {
    return {
      valid: false,
      error: `File extension ${extension} does not match MIME type ${file.type}`,
    }
  }

  return { valid: true }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return ''
  }

  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) {
    return ''
  }

  return filename.substring(lastDot).toLowerCase()
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string | null {
  if (!extension || typeof extension !== 'string') {
    return null
  }

  const normalizedExt = extension.toLowerCase()
  if (!normalizedExt.startsWith('.')) {
    return null
  }

  // Find MIME type that supports this extension
  for (const [mimeType, extensions] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (extensions.includes(normalizedExt as any)) {
      return mimeType
    }
  }

  return null
}



