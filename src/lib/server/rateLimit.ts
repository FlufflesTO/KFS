/**
 * Project Sentinel - Rate Limiting Service
 * Purpose: Prevents abuse by tracking and limiting request frequency per client
 * Dependencies: ./request.js
 * Structural Role: Traffic control layer
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

export async function consumeRateLimit(db: D1Database, request: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const fingerprint = requestFingerprint(request);
  const identifier = `${options.scope}:${options.subject}:${fingerprint}`;
  
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - options.windowSeconds;
  
  // Clean up old entries
  await db.prepare(`
    DELETE FROM rate_limits 
    WHERE identifier = ? AND accessed_at < ?
  `).bind(identifier, new Date(cutoff * 1000).toISOString()).run();
  
  // Count recent attempts
  const countRow = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM rate_limits 
    WHERE identifier = ? AND accessed_at >= ?
  `).bind(identifier, new Date(cutoff * 1000).toISOString()).first();
  
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

export async function resetRateLimit(db: D1Database, request: Request, options: RateLimitOptions): Promise<void> {
  const fingerprint = requestFingerprint(request);
  const identifier = `${options.scope}:${options.subject}:${fingerprint}`;
  
  await db.prepare(`
    DELETE FROM rate_limits 
    WHERE identifier = ?
  `).bind(identifier).run();
}
