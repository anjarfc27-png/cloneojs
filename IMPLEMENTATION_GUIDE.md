# Implementation Guide - Best Practices

## 📖 Cara Menggunakan Foundation Layer yang Baru

Dokumen ini menjelaskan cara menggunakan validation, error handling, dan response utilities yang sudah dibuat.

## 1. Validation Layer

### Menggunakan Zod Schemas di API Routes

**Sebelum (Manual Validation):**
```typescript
// app/api/submissions/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { journal_id, section_id, title, abstract, keywords } = body

  if (!journal_id || !title) {
    return NextResponse.json(
      { error: 'journal_id and title are required' },
      { status: 400 }
    )
  }
  // ... rest of code
}
```

**Sesudah (Dengan Zod Validation):**
```typescript
// app/api/submissions/route.ts
import { validateSubmissionBody, createSubmissionSchema } from '@/lib/validations/submission'
import { errorResponse, successResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate dengan Zod - otomatis throw ValidationError jika invalid
    const validatedData = await validateSubmissionBody(
      createSubmissionSchema,
      body
    )

    // validatedData sudah type-safe dan validated
    const { journal_id, title, abstract, keywords } = validatedData

    // ... rest of business logic
    return successResponse({ submission }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
```

### Keuntungan:
- ✅ Type-safe: TypeScript tahu struktur data yang valid
- ✅ Automatic validation: Tidak perlu manual check
- ✅ Consistent error format: Semua validation errors format sama
- ✅ Reusable: Schema bisa digunakan di client dan server

## 2. Error Handling

### Menggunakan Custom Error Classes

**Sebelum:**
```typescript
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

if (!submission) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

**Sesudah:**
```typescript
import { AuthenticationError, NotFoundError } from '@/lib/errors'

if (!user) {
  throw new AuthenticationError('User must be logged in')
}

if (!submission) {
  throw new NotFoundError('Submission not found', 'submission')
}
```

### Error Response Format:
```json
{
  "error": {
    "message": "Submission not found",
    "code": "NOT_FOUND",
    "statusCode": 404,
    "details": {
      "resource": "submission"
    }
  }
}
```

## 3. Response Utilities

### Menggunakan Standardized Responses

**Sebelum:**
```typescript
return NextResponse.json({ submission }, { status: 201 })
return NextResponse.json({ error: error.message }, { status: 500 })
```

**Sesudah:**
```typescript
import { successResponse, errorResponse, paginatedResponse } from '@/lib/utils/response'

// Success response
return successResponse({ submission }, 201, 'Submission created successfully')

// Error response
return errorResponse(error)

// Paginated response
return paginatedResponse(submissions, total, page, limit)
```

### Response Format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Submission created successfully"
}
```

## 4. Complete Example - Refactored API Route

### Submission API Route (Before & After)

**Before:**
```typescript
// app/api/submissions/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { journal_id, section_id, title, abstract, keywords } = body

    if (!journal_id || !title) {
      return NextResponse.json(
        { error: 'journal_id and title are required' },
        { status: 400 }
      )
    }

    // ... business logic
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({ ... })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**After:**
```typescript
// app/api/submissions/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSubmissionBody, createSubmissionSchema } from '@/lib/validations/submission'
import { AuthenticationError, DatabaseError } from '@/lib/errors'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('User must be logged in')
    }

    // 2. Validation
    const body = await request.json()
    const validatedData = await validateSubmissionBody(
      createSubmissionSchema,
      body
    )

    // 3. Business Logic
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        journal_id: validatedData.journal_id,
        section_id: validatedData.section_id,
        submitter_id: user.id,
        title: validatedData.title,
        abstract: validatedData.abstract,
        keywords: validatedData.keywords,
        status: 'draft',
        current_round: 1,
      })
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create submission', error)
    }

    // 4. Success Response
    return successResponse({ submission }, 201, 'Submission created successfully')
  } catch (error) {
    // 5. Error Response (handles all error types)
    return errorResponse(error)
  }
}
```

## 5. Best Practices Checklist

### ✅ Do's:
- ✅ Always validate input dengan Zod schemas
- ✅ Use custom error classes untuk specific error types
- ✅ Use response utilities untuk consistent format
- ✅ Wrap business logic dalam try-catch
- ✅ Log errors untuk debugging (jangan expose di production)

### ❌ Don'ts:
- ❌ Jangan return error messages langsung tanpa error class
- ❌ Jangan skip validation untuk "trusted" inputs
- ❌ Jangan expose sensitive information di error messages
- ❌ Jangan hardcode error messages (gunakan constants)

## 6. Migration Strategy

### Step-by-Step Refactoring:

1. **Phase 1: Setup Foundation**
   - ✅ Install dependencies (already done)
   - ✅ Create error classes
   - ✅ Create validation schemas
   - ✅ Create response utilities

2. **Phase 2: Refactor API Routes (One by One)**
   - Start dengan routes yang paling sering digunakan
   - Test thoroughly setelah setiap refactor
   - Keep old code commented untuk reference

3. **Phase 3: Add Service Layer**
   - Extract business logic ke services
   - API routes hanya handle HTTP concerns
   - Services handle business logic

4. **Phase 4: Add Repository Layer**
   - Extract database queries ke repositories
   - Services use repositories, not direct Supabase
   - Easier to test dan maintain

## 7. Testing dengan New Architecture

### Testing Validation:
```typescript
import { createSubmissionSchema } from '@/lib/validations/submission'

test('should reject invalid journal_id', async () => {
  const invalidData = {
    journal_id: 'not-a-uuid',
    title: 'Test Title',
  }
  
  await expect(
    createSubmissionSchema.parseAsync(invalidData)
  ).rejects.toThrow()
})
```

### Testing Error Handling:
```typescript
import { ValidationError } from '@/lib/errors'

test('should throw ValidationError for invalid input', async () => {
  try {
    await validateSubmissionBody(createSubmissionSchema, invalidData)
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.statusCode).toBe(400)
  }
})
```

## 8. Type Safety Benefits

Dengan Zod schemas, kita dapat:
- ✅ Generate TypeScript types dari schemas
- ✅ Type-safe di client dan server
- ✅ Auto-complete di IDE
- ✅ Catch errors at compile time

```typescript
// Type automatically inferred dari schema
const data: CreateSubmissionInput = {
  journal_id: '...', // TypeScript knows this is required string
  title: '...',      // TypeScript knows this is required string
  abstract: '...',   // TypeScript knows this is optional string | null
}
```

---

**Next Steps:**
1. Review contoh implementasi di atas
2. Pilih satu API route untuk refactor sebagai proof of concept
3. Test thoroughly
4. Gradually refactor routes lainnya
5. Add service layer setelah semua routes refactored

