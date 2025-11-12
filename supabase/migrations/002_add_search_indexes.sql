-- Migration: Add full-text search indexes
-- Date: 2025-11-10
-- Description: Enable full-text search for articles and submissions

-- Enable full-text search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search vector column to articles table
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update article search vector
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.abstract, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector automatically
DROP TRIGGER IF EXISTS update_article_search_vector_trigger ON articles;
CREATE TRIGGER update_article_search_vector_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_search_vector();

-- Create GIN index for search vector
CREATE INDEX IF NOT EXISTS idx_articles_search_vector
  ON articles USING GIN(search_vector);

-- Add search vector column to submissions table
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update submission search vector
CREATE OR REPLACE FUNCTION update_submission_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.abstract, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update submission search vector
DROP TRIGGER IF EXISTS update_submission_search_vector_trigger ON submissions;
CREATE TRIGGER update_submission_search_vector_trigger
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_search_vector();

-- Create GIN index for submission search vector
CREATE INDEX IF NOT EXISTS idx_submissions_search_vector
  ON submissions USING GIN(search_vector);

-- Create index for author names (for author search)
CREATE INDEX IF NOT EXISTS idx_article_authors_search
  ON article_authors USING GIN(to_tsvector('english', first_name || ' ' || last_name));

-- Create index for submission authors
CREATE INDEX IF NOT EXISTS idx_submission_authors_search
  ON submission_authors USING GIN(to_tsvector('english', first_name || ' ' || last_name));

-- Update existing articles and submissions to populate search_vector
UPDATE articles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(abstract, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(keywords, ' '), '')), 'C')
WHERE search_vector IS NULL;

UPDATE submissions SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(abstract, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(keywords, ' '), '')), 'C')
WHERE search_vector IS NULL;
