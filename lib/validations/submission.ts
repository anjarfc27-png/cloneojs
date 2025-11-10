/**
 * Validation Schemas untuk Submissions
 * 
 * Menggunakan Zod untuk type-safe validation
 * Semua schemas bisa digunakan di client dan server
 */

import { z } from 'zod'

/**
 * Schema untuk create submission
 */
export const createSubmissionSchema = z.object({
  journal_id: z.string().uuid('Invalid journal ID format'),
  section_id: z.string().uuid('Invalid section ID format').optional().nullable(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters'),
  abstract: z
    .string()
    .max(5000, 'Abstract must be less than 5000 characters')
    .optional()
    .nullable(),
  keywords: z
    .union([
      z.array(z.string()),
      z.string().transform((val) =>
        val.split(',').map((k) => k.trim()).filter(Boolean)
      ),
    ])
    .optional()
    .nullable(),
})

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>

/**
 * Schema untuk update submission
 */
export const updateSubmissionSchema = createSubmissionSchema.partial().extend({
  id: z.string().uuid('Invalid submission ID format'),
})

export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>

/**
 * Schema untuk submission decision
 */
export const submissionDecisionSchema = z.object({
  decision_type: z.enum(['accept', 'decline', 'revision', 'resubmit'], {
    errorMap: () => ({
      message: 'Invalid decision type. Must be: accept, decline, revision, or resubmit',
    }),
  }),
  comments: z
    .string()
    .max(5000, 'Comments must be less than 5000 characters')
    .optional()
    .nullable(),
})

export type SubmissionDecisionInput = z.infer<typeof submissionDecisionSchema>

/**
 * Schema untuk assign reviewer
 */
export const assignReviewerSchema = z.object({
  reviewer_id: z.string().uuid('Invalid reviewer ID format'),
  review_round: z.number().int().positive('Review round must be positive'),
  due_date: z
    .string()
    .datetime('Invalid date format')
    .transform((val) => new Date(val))
    .optional(),
})

export type AssignReviewerInput = z.infer<typeof assignReviewerSchema>

/**
 * Helper function untuk validate request body
 */
export async function validateSubmissionBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!fields[path]) {
          fields[path] = []
        }
        fields[path].push(err.message)
      })
      throw new (await import('../errors/AppError')).ValidationError(
        'Validation failed',
        fields
      )
    }
    throw error
  }
}

