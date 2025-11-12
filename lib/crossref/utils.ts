/**
 * Crossref utility functions
 */

import { DOIRegistrationData } from './types'
import { Article, Journal, ArticleAuthor } from '@/types/database'

/**
 * Convert article data to Crossref registration format
 */
export function articleToCrossrefData(
  article: Article & {
    article_authors?: ArticleAuthor[]
    journals?: Journal
  },
  baseUrl: string
): DOIRegistrationData {
  if (!article.journals) {
    throw new Error('Journal data is required for DOI registration')
  }

  return {
    doi: article.doi!,
    title: article.title,
    authors: (article.article_authors || []).map(author => ({
      given: author.first_name,
      family: author.last_name,
      affiliation: author.affiliation ? [author.affiliation] : undefined,
      orcid: author.orcid_id || undefined,
    })),
    abstract: article.abstract || undefined,
    journal: {
      title: article.journals.title,
      issn: article.journals.issn || undefined,
      e_issn: article.journals.e_issn || undefined,
    },
    volume: article.volume || undefined,
    issue: article.issue || undefined,
    year: article.year || new Date(article.published_date || article.created_at).getFullYear(),
    pages: article.pages || undefined,
    url: `${baseUrl}/article/${article.id}`,
    published_date: article.published_date || article.created_at,
    keywords: article.keywords || undefined,
  }
}

/**
 * Validate DOI format
 */
export function validateDOIFormat(doi: string): boolean {
  const doiRegex = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/
  return doiRegex.test(doi)
}

/**
 * Extract DOI from URL
 */
export function extractDOIFromURL(url: string): string | null {
  const doiMatch = url.match(/10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+/)
  return doiMatch ? doiMatch[0] : null
}

/**
 * Format DOI for display
 */
export function formatDOI(doi: string): string {
  return doi.startsWith('10.') ? doi : `10.${doi}`
}

/**
 * Generate DOI URL
 */
export function getDOIURL(doi: string): string {
  const formattedDOI = formatDOI(doi)
  return `https://doi.org/${formattedDOI}`
}
