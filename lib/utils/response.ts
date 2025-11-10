/**
 * Utility functions untuk standardized API responses
 */

import { NextResponse } from 'next/server'
import { AppError } from '../errors/AppError'

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Error response helper
 */
export function errorResponse(error: unknown, status?: number) {
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), {
      status: status || error.statusCode,
    })
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message:
            process.env.NODE_ENV === 'development'
              ? error.message
              : 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: status || 500,
        },
      },
      { status: status || 500 }
    )
  }

  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
      },
    },
    { status: 500 }
  )
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  })
}

