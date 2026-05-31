/**
 * Project Sentinel - Rate Limiting Service
 * Purpose: Prevents abuse by tracking and limiting request frequency per client
 * Dependencies: ./request.js
 * Structural Role: Traffic control layer
 * 
 * Note: This service uses read-only TTL matching. Cleanup is performed by a
 * scheduled cron job via pruneRateLimits() to avoid inline DELETE operations.
 */

import { requestFingerprint } from "./request.js";
import type { D1Database } from "@cloudflare/workers-types";

export interface RateLimitOptions {
  scope: string;
  subject: string;
  maxAttempts: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  retryAfter: number; // seconds to wait before next attempt
  resetAfter: number; // seconds until counter resets
}

/**
 * Consume a rate limit attempt. Read-only - does not delete old entries.
 * TTL-based cleanup is handled separately by pruneRateLimits().
 */
export async function consumeRateLimit(db: D1Database, request: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const fingerprint = requestFingerprint(request);
  const identifier = `${options.scope}:${options.subject}:${fingerprint}`;

  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - options.windowSeconds;
  const cutoffDate = new Date(cutoff * 1000).toISOString();

  // Count recent attempts (read-only, no DELETE)
  const countRow = await db.prepare(`
    SELECT COUNT(*) as count
    FROM rate_limits
    WHERE identifier = ? AND accessed_at >= ?
  `).bind(identifier, cutoffDate).first();

  const attempts = Number(countRow?.count || 0);

  if (attempts >= options.maxAttempts) {
    return {
      allowed: false,
      attempts: attempts,
      retryAfter: options.windowSeconds,
      resetAfter: options.windowSeconds
    };
  }

  // Record this access
  await db.prepare(`
    INSERT INTO rate_limits (identifier, accessed_at)
    VALUES (?, ?)
  `).bind(identifier, new Date().toISOString()).run();

  return {
    allowed: true,
    attempts: attempts + 1,
    retryAfter: 0,
    resetAfter: options.windowSeconds - (now - cutoff)
  };
}

/**
 * Reset rate limit counter for a specific identifier.
 * Used when authentication succeeds or admin manually resets.
 */
export async function resetRateLimit(db: D1Database, request: Request, options: RateLimitOptions): Promise<void> {
  const fingerprint = requestFingerprint(request);
  const identifier = `${options.scope}:${options.subject}:${fingerprint}`;

  await db.prepare(`
    DELETE FROM rate_limits
    WHERE identifier = ?
  `).bind(identifier).run();
}

/**
 * Prune old rate limit entries from the database.
 * This function should be called by a scheduled cron job, not inline with requests.
 * 
 * @param db - D1Database instance
 * @param maxAgeHours - Maximum age of entries to keep (default: 24 hours)
 * @returns Number of entries deleted
 */
export async function pruneRateLimits(db: D1Database, maxAgeHours: number = 24): Promise<number> {
  const cutoffDate = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000)).toISOString();

  // Count entries to be deleted
  const countResult = await db.prepare(`
    SELECT COUNT(*) as count
    FROM rate_limits
    WHERE accessed_at < ?
  `).bind(cutoffDate).first<{ count: number }>();

  const countToDelete = countResult?.count || 0;

  if (countToDelete === 0) {
    return 0;
  }

  // Delete old entries in batches to avoid long-running transactions
  const batchSize = 1000;
  let totalDeleted = 0;

  while (true) {
    const result = await db.prepare(`
      DELETE FROM rate_limits
      WHERE accessed_at < ?
      LIMIT ?
    `).bind(cutoffDate, batchSize).run();

    const deleted = result.meta?.rows_written || 0;
    totalDeleted += deleted;

    if (deleted < batchSize) {
      break;
    }
  }

  return totalDeleted;
}

/**
 * Get rate limit statistics for monitoring.
 */
export async function getRateLimitStats(db: D1Database): Promise<{
  totalEntries: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  uniqueIdentifiers: number;
}> {
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as totalEntries,
      MIN(accessed_at) as oldestEntry,
      MAX(accessed_at) as newestEntry,
      COUNT(DISTINCT identifier) as uniqueIdentifiers
    FROM rate_limits
  `).first();

  return {
    totalEntries: Number(stats?.totalEntries) || 0,
    oldestEntry: String(stats?.oldestEntry) || null,
    newestEntry: String(stats?.newestEntry) || null,
    uniqueIdentifiers: Number(stats?.uniqueIdentifiers) || 0
  };
}
