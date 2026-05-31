/**
 * Project Sentinel - Rate Limit Prune Admin API
 * Purpose: Secure admin endpoint for pruning old rate limit entries
 * Dependencies: ../../../../lib/server/rateLimit, ../../../../lib/server/audit, ../../../../lib/server/bindings
 * Structural Role: Administrative maintenance endpoint for rate limit table cleanup
 * 
 * Security: Requires admin role and CSRF token verification
 * Usage: POST /portal/api/admin/rate-limit-prune with CSRF token
 */

import type { APIRoute } from "astro";
import { auditEvent } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http";
import { verifyCsrfRequest } from "../../../../lib/server/csrf";
import { pruneRateLimits, getRateLimitStats } from "../../../../lib/server/rateLimit";

export const prerender = false;

/**
 * POST handler for rate limit pruning
 * Expects JSON body with optional maxAgeHours parameter
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Require authentication
  if (!locals.user) {
    return unauthorized("Authentication required.");
  }

  // Require admin role
  if (locals.user.role !== "admin") {
    return forbidden("Admin access required for rate limit pruning.");
  }

  const db = getDatabase();

  try {
    // Verify CSRF token
    const csrfValid = await verifyCsrfRequest(request, locals.user);
    if (!csrfValid) {
      return badRequest("Invalid CSRF token");
    }

    // Parse request body
    let maxAgeHours = 24; // Default: prune entries older than 24 hours
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json() as { maxAgeHours?: number } | undefined;
      if (body?.maxAgeHours !== undefined) {
        maxAgeHours = Number(body.maxAgeHours);
        if (!Number.isFinite(maxAgeHours) || maxAgeHours < 1 || maxAgeHours > 720) {
          return badRequest("maxAgeHours must be between 1 and 720 hours.");
        }
      }
    }

    // Get stats before pruning
    const beforeStats = await getRateLimitStats(db);

    // Perform pruning
    const deletedCount = await pruneRateLimits(db, maxAgeHours);

    // Get stats after pruning
    const afterStats = await getRateLimitStats(db);

    // Audit the operation
    await auditEvent(db, request, {
      eventType: "admin.rate_limit.prune",
      entityType: "rate_limits",
      entityId: "system",
      outcome: "success",
      user: locals.user,
      subject: locals.user.email,
      metadata: {
        maxAgeHours,
        deletedCount,
        beforeStats: {
          totalEntries: beforeStats.totalEntries,
          uniqueIdentifiers: beforeStats.uniqueIdentifiers
        },
        afterStats: {
          totalEntries: afterStats.totalEntries,
          uniqueIdentifiers: afterStats.uniqueIdentifiers
        }
      }
    });

    return json({
      ok: true,
      deletedCount,
      maxAgeHours,
      beforeStats,
      afterStats
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    const err = error as Error;
    await auditEvent(db, request, {
      eventType: "admin.rate_limit.prune",
      entityType: "rate_limits",
      entityId: "system",
      outcome: "failure",
      user: locals.user,
      subject: locals.user.email,
      metadata: {
        error: err.message,
        name: err.name
      }
    });

    return serverError("Rate limit pruning failed.");
  }
};

/**
 * GET handler for rate limit statistics
 * Returns current rate limit table stats without pruning
 */
export const GET: APIRoute = async ({ request, locals }) => {
  // Require authentication
  if (!locals.user) {
    return unauthorized("Authentication required.");
  }

  // Require admin role
  if (locals.user.role !== "admin") {
    return forbidden("Admin access required for rate limit statistics.");
  }

  const db = getDatabase();

  try {
    const stats = await getRateLimitStats(db);

    await auditEvent(db, request, {
      eventType: "admin.rate_limit.stats",
      entityType: "rate_limits",
      entityId: "system",
      outcome: "success",
      user: locals.user,
      subject: locals.user.email,
      metadata: stats
    });

    return json({
      ok: true,
      stats
    });
  } catch (error) {
    const err = error as Error;
    await auditEvent(db, request, {
      eventType: "admin.rate_limit.stats",
      entityType: "rate_limits",
      entityId: "system",
      outcome: "failure",
      user: locals.user,
      subject: locals.user.email,
      metadata: {
        error: err.message,
        name: err.name
      }
    });

    return serverError("Failed to retrieve rate limit statistics.");
  }
};

export const ALL: APIRoute = () => {
  return methodNotAllowed(["GET", "POST"]);
};
