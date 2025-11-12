-- Migration: Add Crossref fields to doi_registrations table
-- Date: 2025-11-10
-- Description: Add fields for Crossref API integration

-- Add Crossref fields to doi_registrations table
ALTER TABLE doi_registrations
  ADD COLUMN IF NOT EXISTS crossref_deposit_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS crossref_response JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deposit_date TIMESTAMP WITH TIME ZONE;

-- Create index for crossref_deposit_id
CREATE INDEX IF NOT EXISTS idx_doi_registrations_crossref_deposit_id 
  ON doi_registrations(crossref_deposit_id);

-- Create index for status and retry_count for failed registrations
CREATE INDEX IF NOT EXISTS idx_doi_registrations_status_retry 
  ON doi_registrations(status, retry_count)
  WHERE status = 'pending' OR status = 'failed';

-- Add comment
COMMENT ON COLUMN doi_registrations.crossref_deposit_id IS 'Crossref deposit ID for tracking';
COMMENT ON COLUMN doi_registrations.crossref_response IS 'Full response from Crossref API';
COMMENT ON COLUMN doi_registrations.retry_count IS 'Number of retry attempts for failed registrations';
COMMENT ON COLUMN doi_registrations.last_attempt IS 'Last attempt timestamp for retry logic';
COMMENT ON COLUMN doi_registrations.deposit_date IS 'Date when DOI was deposited to Crossref';
