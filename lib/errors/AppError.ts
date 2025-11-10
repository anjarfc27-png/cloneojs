/**
 * Base Application Error Class
 * 
 * Semua custom errors harus extend dari class ini
 * untuk konsistensi error handling di seluruh aplikasi
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Convert error to JSON format untuk API response
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code || this.name,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details }),
      },
    }
  }
}

/**
 * Validation Error
 * Digunakan untuk input validation errors
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public fields?: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR', { fields })
    this.name = 'ValidationError'
  }
}

/**
 * Authentication Error
 * Digunakan untuk authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization Error
 * Digunakan untuk authorization failures (permission denied)
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access denied',
    public resource?: string,
    public action?: string
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', { resource, action })
    this.name = 'AuthorizationError'
  }
}

/**
 * Not Found Error
 * Digunakan untuk resources yang tidak ditemukan
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    public resource?: string
  ) {
    super(message, 404, 'NOT_FOUND', { resource })
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict Error
 * Digunakan untuk resource conflicts (e.g., duplicate)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * Database Error
 * Wrapper untuk database errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database error',
    public originalError?: Error
  ) {
    super(message, 500, 'DATABASE_ERROR', {
      originalError: originalError?.message,
    })
    this.name = 'DatabaseError'
  }
}

/**
 * Helper function untuk handle errors di API routes
 */
export function handleApiError(error: unknown): Response {
  // Log error untuk debugging (jangan expose di production)
  console.error('[API Error]', error)

  // Jika sudah AppError, langsung return
  if (error instanceof AppError) {
    return Response.json(error.toJSON(), { status: error.statusCode })
  }

  // Jika Error biasa, wrap sebagai AppError
  if (error instanceof Error) {
    const appError = new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    )
    return Response.json(appError.toJSON(), { status: 500 })
  }

  // Unknown error
  const appError = new AppError('An unexpected error occurred', 500)
  return Response.json(appError.toJSON(), { status: 500 })
}

