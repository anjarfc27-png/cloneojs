export type UserRole = 'super_admin' | 'editor' | 'section_editor' | 'reviewer' | 'author' | 'reader'

export type SubmissionStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'review_completed'
  | 'revision_requested'
  | 'accepted'
  | 'declined'
  | 'published'
  | 'archived'

export type ReviewStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'

export type ReviewRecommendation = 
  | 'accept'
  | 'minor_revision'
  | 'major_revision'
  | 'reject'
  | 'resubmit'

export type DecisionType = 'accept' | 'decline' | 'revision' | 'resubmit'

export interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  domain?: string
  settings?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  user_id: string
  tenant_id: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Journal {
  id: string
  tenant_id: string
  title: string
  description?: string
  abbreviation?: string
  issn?: string
  e_issn?: string
  publisher?: string
  language: string
  settings?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  journal_id: string
  title: string
  abbreviation?: string
  description?: string
  policy?: string
  sequence: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  journal_id: string
  section_id?: string
  submitter_id: string
  title: string
  abstract?: string
  keywords?: string[]
  language: string
  status: SubmissionStatus
  submission_date?: string
  last_modified: string
  editor_id?: string
  current_round: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SubmissionAuthor {
  id: string
  submission_id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  affiliation?: string
  country?: string
  bio?: string
  is_primary: boolean
  sequence: number
  created_at: string
}

export interface SubmissionFile {
  id: string
  submission_id: string
  file_type: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  uploaded_by: string
  version: number
  created_at: string
}

export interface ReviewAssignment {
  id: string
  submission_id: string
  reviewer_id: string
  editor_id: string
  round: number
  status: ReviewStatus
  recommendation?: ReviewRecommendation
  review_due_date?: string
  review_completed_date?: string
  review_form_data?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface EditorialDecision {
  id: string
  submission_id: string
  editor_id: string
  decision_type: DecisionType
  round: number
  comments?: string
  created_at: string
}

export interface Article {
  id: string
  submission_id: string
  journal_id: string
  section_id?: string
  title: string
  abstract?: string
  keywords?: string[]
  doi?: string
  volume?: number
  issue?: number
  year?: number
  pages?: string
  published_date?: string
  views_count: number
  downloads_count: number
  citation_count: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

