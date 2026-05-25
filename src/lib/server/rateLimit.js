/**
 * Project Sentinel - Rate Limiting Services
 * Purpose: Provides a sliding window rate limiter backed by D1 for API and authentication endpoints
 * Dependencies: ./request.js
 * Structural Role: Request frequency throttling security layer
 */

import { requestFingerprint } from "./request.js";

export async function consumeRateLimit(db, request, options = {}) {
  const scope = String(options.scope || "portal").slice(0, 80);
  const subject = String(options.subject || "anonymous").toLowerCase();
  const maxAttempts = Number.isInteger(options.maxAttempts) ? options.maxAttempts : 8;
  const windowSeconds = Number.isInteger(options.windowSeconds) ? options.windowSeconds : 15 * 60;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const fingerprint = await requestFingerprint(request, subject);
  const key = `${scope}:${fingerprint.ipHash}:${fingerprint.subjectHash}`;

  await db
    .prepare(
      `INSERT INTO portal_rate_limits (rate_key, scope, window_start, attempts)
       VALUES (?1, ?2, ?3, 1)
       ON CONFLICT(rate_key) DO UPDATE SET
         attempts = CASE
           WHEN excluded.window_start > portal_rate_limits.window_start THEN 1
           ELSE portal_rate_limits.attempts + 1
         END,
         window_start = CASE
           WHEN excluded.window_start > portal_rate_limits.window_start THEN excluded.window_start
           ELSE portal_rate_limits.window_start
         END,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .bind(key, scope, windowStart)
    .run();

  const record = await db
    .prepare(`SELECT attempts, window_start FROM portal_rate_limits WHERE rate_key = ?1 LIMIT 1`)
    .bind(key)
    .first();

  const attempts = Number(record?.attempts || 0);
  const activeWindowStart = Number(record?.window_start || windowStart);
  const retryAfter = Math.max(1, activeWindowStart + windowSeconds - nowSeconds);

  return {
    allowed: attempts <= maxAttempts,
    attempts,
    maxAttempts,
    retryAfter
  };
}

export async function resetRateLimit(db, request, options = {}) {
  const scope = String(options.scope || "portal").slice(0, 80);
  const subject = String(options.subject || "anonymous").toLowerCase();
  const fingerprint = await requestFingerprint(request, subject);
  const key = `${scope}:${fingerprint.ipHash}:${fingerprint.subjectHash}`;

  await db.prepare(`DELETE FROM portal_rate_limits WHERE rate_key = ?1`).bind(key).run();
}
