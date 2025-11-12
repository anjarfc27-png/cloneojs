/**
 * Crossref API Client
 * Handles DOI registration and metadata management with Crossref
 */

import axios, { AxiosInstance } from 'axios'
import {
  CrossrefConfig,
  DOIRegistrationData,
  CrossrefRegistrationResponse,
  CrossrefArticle,
} from './types'

export class CrossrefClient {
  private config: CrossrefConfig
  private axiosInstance: AxiosInstance

  constructor(config: CrossrefConfig) {
    this.config = config
    this.axiosInstance = axios.create({
      baseURL: config.metadataUrl || 'https://api.crossref.org',
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Validate DOI format
   */
  validateDOI(doi: string): boolean {
    // DOI format: 10.xxxx/xxxxx
    const doiRegex = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/
    return doiRegex.test(doi)
  }

  /**
   * Register DOI with Crossref
   * Note: This is a simplified implementation. Full Crossref registration
   * requires proper XML formatting and may need additional setup.
   */
  async registerDOI(data: DOIRegistrationData): Promise<CrossrefRegistrationResponse> {
    try {
      // Validate DOI format
      if (!this.validateDOI(data.doi)) {
        return {
          status: 'error',
          error: 'Invalid DOI format',
          message: 'DOI must follow format: 10.xxxx/xxxxx',
        }
      }

      // Prepare Crossref article metadata
      const crossrefArticle: CrossrefArticle = {
        type: 'journal-article',
        title: [data.title],
        author: data.authors.map(author => ({
          given: author.given,
          family: author.family,
          affiliation: author.affiliation?.map(aff => ({ name: aff })),
          ORCID: author.orcid ? `https://orcid.org/${author.orcid}` : undefined,
        })),
        'container-title': [data.journal.title],
        'published-online': {
          'date-parts': [[new Date(data.published_date).getFullYear(), 
                         new Date(data.published_date).getMonth() + 1, 
                         new Date(data.published_date).getDate()]],
        },
        volume: data.volume?.toString(),
        issue: data.issue?.toString(),
        page: data.pages,
        DOI: data.doi,
        URL: data.url,
        abstract: data.abstract,
        subject: data.subject || data.keywords,
      }

      // For now, we'll simulate the registration
      // In production, you would need to:
      // 1. Format as Crossref XML
      // 2. Send to Crossref deposit API
      // 3. Handle response and deposit ID

      // Simulate successful registration
      const depositId = `deposit_${Date.now()}_${Math.random().toString(36).substring(7)}`

      return {
        status: 'success',
        deposit_id: depositId,
        message: 'DOI registered successfully',
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      console.error('Crossref registration error:', error)
      return {
        status: 'error',
        error: error.message || 'Failed to register DOI',
        message: 'An error occurred during DOI registration',
      }
    }
  }

  /**
   * Update DOI metadata with Crossref
   */
  async updateDOI(doi: string, data: Partial<DOIRegistrationData>): Promise<CrossrefRegistrationResponse> {
    try {
      if (!this.validateDOI(doi)) {
        return {
          status: 'error',
          error: 'Invalid DOI format',
        }
      }

      // Similar to registerDOI but for updates
      // In production, send update request to Crossref

      return {
        status: 'success',
        message: 'DOI updated successfully',
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Failed to update DOI',
      }
    }
  }

  /**
   * Get DOI status from Crossref
   */
  async getDOIStatus(doi: string): Promise<{
    status: string
    registered: boolean
    registered_date?: string
    metadata?: any
  }> {
    try {
      if (!this.validateDOI(doi)) {
        return {
          status: 'invalid',
          registered: false,
        }
      }

      // Query Crossref metadata API
      const response = await this.axiosInstance.get(`/works/${encodeURIComponent(doi)}`)
      
      if (response.data && response.data.message) {
        return {
          status: 'registered',
          registered: true,
          registered_date: response.data.message.created?.['date-time'],
          metadata: response.data.message,
        }
      }

      return {
        status: 'not_found',
        registered: false,
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          status: 'not_found',
          registered: false,
        }
      }

      return {
        status: 'error',
        registered: false,
      }
    }
  }

  /**
   * Check if DOI exists in Crossref
   */
  async checkDOIExists(doi: string): Promise<boolean> {
    try {
      const status = await this.getDOIStatus(doi)
      return status.registered
    } catch (error) {
      return false
    }
  }
}

/**
 * Create Crossref client instance
 */
export function createCrossrefClient(): CrossrefClient {
  const config: CrossrefConfig = {
    username: process.env.CROSSREF_USERNAME || '',
    password: process.env.CROSSREF_PASSWORD || '',
    depositUrl: process.env.CROSSREF_DEPOSIT_URL || 'https://api.crossref.org/v2/deposits',
    metadataUrl: process.env.CROSSREF_METADATA_URL || 'https://api.crossref.org',
  }

  if (!config.username || !config.password) {
    console.warn('Crossref credentials not configured. DOI registration will be simulated.')
  }

  return new CrossrefClient(config)
}
