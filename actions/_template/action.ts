/**
 * Server Action Template
 * 
 * This is a template for creating Server Actions following the standard pattern:
 * 1. Validate input with Zod
 * 2. Sanitize HTML if needed
 * 3. Perform database operation with Admin Client
 * 4. Log audit event
 * 5. Revalidate paths
 * 6. Return result
 * 
 * COPY THIS TEMPLATE AND ADAPT FOR YOUR SPECIFIC USE CASE
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'

// Define your Zod schema
const schema = z.object({
  // Example fields
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  html_content: z.string().optional(),
})

type Input = z.infer<typeof schema>

/**
 * Example Server Action: Create or Update Entity
 */
export async function createOrUpdateEntity(values: Input) {
  try {
    // 1. Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // 2. Validate input
    const data = schema.parse(values)

    // 3. Sanitize HTML if needed
    if (data.html_content) {
      data.html_content = sanitizeHTML(data.html_content)
    }

    // 4. Get admin client
    const client = createAdminClient()

    // 5. Perform database operation
    let result
    if (data.id) {
      // Update existing
      const { data: updated, error } = await client
        .from('your_table')
        .update({
          name: data.name,
          description: data.description,
          html_content: data.html_content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select()
        .single()

      if (error) {
        console.error('[createOrUpdateEntity] Error updating:', error)
        return {
          success: false,
          error: error.message,
        }
      }

      result = updated

      // Log audit event
      await auditLog({
        action: 'entity_updated',
        entity_type: 'entity',
        entity_id: data.id,
        details: {
          name: data.name,
        },
      })
    } else {
      // Create new
      const { data: created, error } = await client
        .from('your_table')
        .insert({
          name: data.name,
          description: data.description,
          html_content: data.html_content,
        })
        .select()
        .single()

      if (error) {
        console.error('[createOrUpdateEntity] Error creating:', error)
        return {
          success: false,
          error: error.message,
        }
      }

      result = created

      // Log audit event
      await auditLog({
        action: 'entity_created',
        entity_type: 'entity',
        entity_id: created.id,
        details: {
          name: data.name,
        },
      })
    }

    // 6. Revalidate paths
    revalidatePath('/super-admin/your-module')
    revalidatePath('/super-admin/your-module/[id]', 'page')

    // 7. Return result
    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('[createOrUpdateEntity] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Example Server Action: Delete Entity
 */
export async function deleteEntity(id: string) {
  try {
    // 1. Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // 2. Validate input
    const schema = z.string().uuid()
    const entityId = schema.parse(id)

    // 3. Get admin client
    const client = createAdminClient()

    // 4. Get entity before deletion (for audit log)
    const { data: entity } = await client
      .from('your_table')
      .select('id, name')
      .eq('id', entityId)
      .single()

    // 5. Delete entity
    const { error } = await client
      .from('your_table')
      .delete()
      .eq('id', entityId)

    if (error) {
      console.error('[deleteEntity] Error deleting:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // 6. Log audit event
    await auditLog({
      action: 'entity_deleted',
      entity_type: 'entity',
      entity_id: entityId,
      details: {
        name: entity?.name,
      },
    })

    // 7. Revalidate paths
    revalidatePath('/super-admin/your-module')

    // 8. Return result
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[deleteEntity] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}



