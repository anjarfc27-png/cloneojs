/**
 * Crossref API Types
 */

export interface CrossrefAuthor {
  given: string
  family: string
  affiliation?: Array<{
    name: string
  }>
  ORCID?: string
}

export interface CrossrefJournal {
  title: string
  'container-title'?: string
  ISSN?: string[]
  'publisher-place'?: string
}

export interface CrossrefArticle {
  type: 'journal-article'
  title: string[]
  author: CrossrefAuthor[]
  'container-title': string[]
  'published-print'?: {
    'date-parts': number[][]
  }
  'published-online'?: {
    'date-parts': number[][]
  }
  volume?: string
  issue?: string
  page?: string
  DOI: string
  URL: string
  abstract?: string
  subject?: string[]
}

export interface CrossrefDeposit {
  registrant: string
  'deposited-timestamp': string
  'deposited-content': {
    'deposited-date': string
    'deposited-by': string
  }
  'deposited-reference'?: string
}

export interface CrossrefRegistrationResponse {
  status: 'success' | 'error'
  deposit_id?: string
  message?: string
  error?: string
  timestamp?: string
}

export interface DOIRegistrationData {
  doi: string
  title: string
  authors: Array<{
    given: string
    family: string
    affiliation?: string[]
    orcid?: string
  }>
  abstract?: string
  journal: {
    title: string
    issn?: string
    e_issn?: string
  }
  volume?: number
  issue?: number
  year: number
  pages?: string
  url: string
  published_date: string
  keywords?: string[]
  subject?: string[]
}

export interface CrossrefConfig {
  username: string
  password: string
  depositUrl?: string
  metadataUrl?: string
}
