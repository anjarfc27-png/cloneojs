/**
 * File Hashing Utility
 * 
 * Provides utilities for hashing files using SHA-256.
 * Used for file integrity verification and malware detection.
 */

import { createHash } from 'crypto'

/**
 * Calculate SHA-256 hash of a file buffer
 * 
 * @param buffer - File buffer
 * @returns SHA-256 hash (hex string)
 */
export function calculateFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Calculate SHA-256 hash of a string
 * 
 * @param content - String content
 * @returns SHA-256 hash (hex string)
 */
export function calculateStringHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Verify file hash
 * 
 * @param buffer - File buffer
 * @param expectedHash - Expected hash (hex string)
 * @returns True if hash matches
 */
export function verifyFileHash(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = calculateFileHash(buffer)
  return actualHash.toLowerCase() === expectedHash.toLowerCase()
}

/**
 * Format hash for display (first 8 and last 8 characters)
 * 
 * @param hash - Full hash string
 * @returns Formatted hash (e.g., "a1b2c3d4...e5f6g7h8")
 */
export function formatHash(hash: string): string {
  if (!hash || hash.length < 16) {
    return hash
  }

  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
}



