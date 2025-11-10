import { createClient } from '@/lib/supabase/server'

export interface Issue {
  id: string
  journal_id: string
  volume: number | null
  number: string | null
  year: number
  title: string | null
  description: string | null
  published_date: string | null
  is_published: boolean
  cover_image_url: string | null
  cover_image_alt_text: string | null
  access_status: string
  created_at: string
  updated_at: string
  // Computed fields
  itemCount?: number
  status?: 'draft' | 'scheduled' | 'published'
}

export interface IssueInsert {
  journal_id: string
  volume?: number | null
  number?: string | null
  year: number
  title?: string | null
  description?: string | null
  published_date?: string | null
  is_published?: boolean
  cover_image_url?: string | null
  cover_image_alt_text?: string | null
  access_status?: string
}

/**
 * Determine issue status based on is_published and published_date
 */
export function getIssueStatus(issue: Issue): 'draft' | 'scheduled' | 'published' {
  if (issue.is_published) {
    return 'published'
  }
  if (issue.published_date) {
    return 'scheduled'
  }
  return 'draft'
}

/**
 * Get issues with pagination and filtering
 */
export async function getIssues(
  journalId: string | null,
  status: 'future' | 'back',
  page: number = 1,
  pageSize: number = 10,
  search?: string
) {
  const supabase = await createClient()
  
  let query = supabase
    .from('issues')
    .select('*', { count: 'exact' })
  
  if (journalId) {
    query = query.eq('journal_id', journalId)
  }
  
  // Filter by status
  if (status === 'future') {
    // Future issues: draft or scheduled (not published)
    query = query.eq('is_published', false)
  } else if (status === 'back') {
    // Back issues: published
    query = query.eq('is_published', true)
  }
  
  // Search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,number.ilike.%${search}%,year.eq.${parseInt(search) || 0}`)
  }
  
  // Order by year desc, then volume desc, then number desc
  query = query.order('year', { ascending: false })
    .order('volume', { ascending: false, nullsFirst: false })
    .order('number', { ascending: false, nullsFirst: false })
  
  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw error
  }
  
  // Get item counts for each issue
  const issueIds = (data || []).map((issue: any) => issue.id)
  const itemCounts: Record<string, number> = {}
  
  if (issueIds.length > 0) {
    const { data: articlesData } = await supabase
      .from('articles')
      .select('issue_id')
      .in('issue_id', issueIds)
    
    // Count articles per issue
    articlesData?.forEach((article: any) => {
      if (article.issue_id) {
        itemCounts[article.issue_id] = (itemCounts[article.issue_id] || 0) + 1
      }
    })
  }
  
  // Transform data to include computed fields
  const issues = (data || []).map((issue: any) => {
    const itemCount = itemCounts[issue.id] || 0
    const status = getIssueStatus(issue as Issue)
    
    return {
      ...issue,
      itemCount,
      status,
    }
  })
  
  return {
    issues,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * Get single issue by ID
 */
export async function getIssueById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    throw error
  }
  
  if (!data) {
    return null
  }
  
  // Get item count
  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('issue_id', id)
  
  const itemCount = count || 0
  const status = getIssueStatus(data as Issue)
  
  return {
    ...data,
    itemCount,
    status,
  }
}

/**
 * Create new issue
 */
export async function createIssue(data: IssueInsert) {
  const supabase = await createClient()
  
  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      ...data,
      is_published: data.is_published || false,
      access_status: data.access_status || 'open',
    })
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return issue
}

/**
 * Update issue
 */
export async function updateIssue(id: string, data: Partial<IssueInsert>) {
  const supabase = await createClient()
  
  const { data: issue, error } = await supabase
    .from('issues')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return issue
}

/**
 * Delete issue
 */
export async function deleteIssue(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', id)
  
  if (error) {
    throw error
  }
}

/**
 * Publish issue (set is_published = true and published_date = now if not set)
 */
export async function publishIssue(id: string) {
  const supabase = await createClient()
  
  // Get current issue to check published_date
  const { data: currentIssue } = await supabase
    .from('issues')
    .select('published_date')
    .eq('id', id)
    .single()
  
  const updateData: any = {
    is_published: true,
    updated_at: new Date().toISOString(),
  }
  
  // Set published_date if not already set
  if (!currentIssue?.published_date) {
    updateData.published_date = new Date().toISOString()
  }
  
  const { data: issue, error } = await supabase
    .from('issues')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return issue
}

