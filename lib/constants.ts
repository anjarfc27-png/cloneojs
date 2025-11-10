export const SUBMISSION_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  REVIEW_COMPLETED: 'review_completed',
  REVISION_REQUESTED: 'revision_requested',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const REVIEW_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  EDITOR: 'editor',
  SECTION_EDITOR: 'section_editor',
  REVIEWER: 'reviewer',
  AUTHOR: 'author',
  READER: 'reader',
} as const

export const REVIEW_RECOMMENDATIONS = {
  ACCEPT: 'accept',
  MINOR_REVISION: 'minor_revision',
  MAJOR_REVISION: 'major_revision',
  REJECT: 'reject',
  RESUBMIT: 'resubmit',
} as const

export const DECISION_TYPES = {
  ACCEPT: 'accept',
  DECLINE: 'decline',
  REVISION: 'revision',
  RESUBMIT: 'resubmit',
} as const

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  review_completed: 'bg-purple-100 text-purple-800',
  revision_requested: 'bg-orange-100 text-orange-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
} as const

