/**
 * Project Sentinel - Data Retention Cron Endpoint
 * Purpose: Secure admin endpoint for executing POPIA Section 14 data retention policies.
 *          Automatically deletes expired personal data based on configured retention periods.
 * 
 * Features:
 * - GET: Retrieve current retention policy status and statistics
 * - POST: Execute retention policies (delete expired data)
 * - Admin-only access with CSRF protection
 * - Batch deletion to avoid long-running transactions
 * - Comprehensive audit logging for compliance
 * - Dry-run mode for testing without actual deletion
 * 
 * Security:
 * - Requires authenticated admin user
 * - CSRF token verification for POST requests
 * - All operations logged to data_retention_logs table
 * - Audit events recorded for compliance
 * 
 * POPIA Section 14 Compliance:
 * - Personal information must not be retained longer than necessary
 * - This endpoint enforces configured retention periods
 * - Audit trail maintained for all deletion operations
 * 
 * Dependencies: ../../../../lib/server/audit, ../../../../lib/server/bindings, ../../../../lib/server/csrf
 * Structural Role: Administrative data governance endpoint
 */

import type { APIRoute } from "astro";
import { auditEvent } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings";
import {
  badRequest,
  forbidden,
  json,
  methodNotAllowed,
  serverError,
  unauthorized
} from "../../../../lib/server/http";
import { verifyCsrfRequest } from "../../../../lib/server/csrf";

export const prerender = false;

// ============================================================================
// Type Definitions
// ============================================================================

interface RetentionPolicy {
  id: string;
  entity_type: string;
  retention_days: number;
  legal_basis: string;
  description: string | null;
  is_active: number;
}

interface RetentionStats {
  entity_type: string;
  total_records: number;
  expired_records: number;
  cutoff_date: string;
  retention_days: number;
}

interface DeletionResult {
  entity_type: string;
  records_deleted: number;
  batches_processed: number;
  error?: string;
}

interface ExecuteRetentionResponse {
  ok: boolean;
  dry_run: boolean;
  executed_at: string;
  policies_processed: number;
  total_records_deleted: number;
  results: DeletionResult[];
  errors: string[];
}

interface GetRetentionStatsResponse {
  ok: boolean;
  policies: Array<{
    id: string;
    entity_type: string;
    retention_days: number;
    legal_basis: string;
    description: string | null;
    is_active: boolean;
    stats?: RetentionStats;
  }>;
  summary: {
    total_policies: number;
    active_policies: number;
    total_expired_records: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

const BATCH_SIZE = 1000;
const DEFAULT_ENTITY_DATE_COLUMN: Record<string, string> = {
  audit_events: "created_at",
  user_feedback: "submitted_at",
  rate_limits: "accessed_at",
  document_access_logs: "created_at",
  session_revocations: "created_at",
  contact_submissions: "submitted_at",
  password_reset_tokens: "created_at"
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all active retention policies from the database.
 */
async function getActivePolicies(db: ReturnType<typeof getDatabase>): Promise<RetentionPolicy[]> {
  const result = await db.prepare(`
    SELECT id, entity_type, retention_days, legal_basis, description, is_active
    FROM data_retention_policies
    WHERE is_active = 1
    ORDER BY entity_type
  `).all() as { results: RetentionPolicy[] };

  return result.results || [];
}

/**
 * Calculate the cutoff date for a given retention period.
 */
function calculateCutoffDate(retentionDays: number): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  return cutoffDate.toISOString();
}

/**
 * Count expired records for a given entity type and cutoff date.
 */
async function countExpiredRecords(
  db: ReturnType<typeof getDatabase>,
  entityType: string,
  cutoffDate: string
): Promise<number> {
  const dateColumn = DEFAULT_ENTITY_DATE_COLUMN[entityType] || "created_at";

  try {
    // Check if table exists
    const tableCheck = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).bind(entityType).first();

    if (!tableCheck) {
      console.warn(`[DataRetention] Table ${entityType} does not exist, skipping`);
      return 0;
    }

    const result = await db.prepare(`
      SELECT COUNT(*) as count
      FROM ${entityType}
      WHERE ${dateColumn} < ?
    `).bind(cutoffDate).first<{ count: number }>();

    return result?.count ?? 0;
  } catch (error) {
    console.error(`[DataRetention] Error counting expired records for ${entityType}:`, error);
    return 0;
  }
}

/**
 * Delete expired records in batches to avoid long transactions.
 */
async function deleteExpiredRecords(
  db: ReturnType<typeof getDatabase>,
  entityType: string,
  cutoffDate: string,
  dryRun: boolean = false
): Promise<{ deleted: number; batches: number; error?: string }> {
  const dateColumn = DEFAULT_ENTITY_DATE_COLUMN[entityType] || "created_at";
  let totalDeleted = 0;
  let batchesProcessed = 0;

  try {
    // Check if table exists
    const tableCheck = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).bind(entityType).first();

    if (!tableCheck) {
      return { deleted: 0, batches: 0 };
    }

    if (dryRun) {
      // Dry run - just count what would be deleted
      const countResult = await db.prepare(`
        SELECT COUNT(*) as count
        FROM ${entityType}
        WHERE ${dateColumn} < ?
      `).bind(cutoffDate).first<{ count: number }>();

      return {
        deleted: countResult?.count || 0,
        batches: 1
      };
    }

    // Actual deletion in batches
    while (true) {
      const result = await db.prepare(`
        DELETE FROM ${entityType}
        WHERE ${dateColumn} < ?
        LIMIT ?
      `).bind(cutoffDate, BATCH_SIZE).run();

      const deleted = result.meta?.rows_written || 0;
      totalDeleted += deleted;
      batchesProcessed++;

      if (deleted < BATCH_SIZE) {
        break;
      }
    }

    return { deleted: totalDeleted, batches: batchesProcessed };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DataRetention] Error deleting records for ${entityType}:`, error);
    return {
      deleted: totalDeleted,
      batches: batchesProcessed,
      error: errorMessage
    };
  }
}

/**
 * Log a retention operation to the audit trail.
 */
async function logRetentionOperation(
  db: ReturnType<typeof getDatabase>,
  policyId: string,
  entityType: string,
  recordsAffected: number,
  operationStatus: "completed" | "failed" | "dry_run",
  errorMessage?: string,
  executedBy?: string,
  executionDurationMs?: number
): Promise<void> {
  const id = crypto.randomUUID();

  try {
    await db.prepare(`
      INSERT INTO data_retention_logs (
        id, policy_id, entity_type, records_affected, operation_type, 
        operation_status, error_message, executed_by, execution_duration_ms
      ) VALUES (?, ?, ?, ?, 'delete', ?, ?, ?, ?)
    `).bind(
      id,
      policyId,
      entityType,
      recordsAffected,
      operationStatus,
      errorMessage || null,
      executedBy || null,
      executionDurationMs || null
    ).run();
  } catch (error) {
    console.error("[DataRetention] Failed to log retention operation:", error);
  }
}

// ============================================================================
// GET Handler - Retrieve Retention Policy Status
// ============================================================================

export const GET: APIRoute = async ({ request, locals }) => {
  // Require authentication
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const user = (locals as { user?: { id: string; name: string; email: string; role: string } | undefined }).user;
  
  if (!user) {
    return unauthorized("Authentication required.");
  }

  // Require admin role
  if (user.role !== "admin") {
    return forbidden("Admin access required for data retention management.");
  }

  const db = getDatabase();

  try {
    const policies = await getActivePolicies(db);
    const responsePolicies: GetRetentionStatsResponse["policies"] = [];
    let totalExpiredRecords = 0;

    for (const policy of policies) {
      const cutoffDate = calculateCutoffDate(policy.retention_days);
      const expiredCount = await countExpiredRecords(db, policy.entity_type, cutoffDate);

      responsePolicies.push({
        id: policy.id,
        entity_type: policy.entity_type,
        retention_days: policy.retention_days,
        legal_basis: policy.legal_basis,
        description: policy.description,
        is_active: policy.is_active === 1,
        stats: {
          entity_type: policy.entity_type,
          total_records: 0, // Would require separate count query
          expired_records: expiredCount,
          cutoff_date: cutoffDate,
          retention_days: policy.retention_days
        }
      });

      totalExpiredRecords += expiredCount;
    }

    const response: GetRetentionStatsResponse = {
      ok: true,
      policies: responsePolicies,
      summary: {
        total_policies: policies.length,
        active_policies: policies.filter((p) => p.is_active === 1).length,
        total_expired_records: totalExpiredRecords
      }
    };

    // Audit the access
    await auditEvent(db, request, {
      eventType: "admin.data_retention.stats",
      entityType: "data_retention_policies",
      entityId: "system",
      outcome: "success",
      user,
      subject: user.email,
      metadata: {
        policy_count: policies.length,
        expired_record_count: totalExpiredRecords
      }
    });

    return json(response);
  } catch (error) {
    const err = error as Error;
    console.error("[DataRetention] GET error:", err);

    await auditEvent(db, request, {
      eventType: "admin.data_retention.stats",
      entityType: "data_retention_policies",
      entityId: "system",
      outcome: "failure",
      user: user ?? null,
      subject: user?.email ?? "unknown",
      metadata: {
        error: err.message,
        name: err.name
      }
    });

    return serverError("Failed to retrieve data retention statistics.");
  }
};

// ============================================================================
// POST Handler - Execute Retention Policies
// ============================================================================

export const POST: APIRoute = async ({ request, locals }) => {
  // Require authentication
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const user = (locals as { user?: { id: string; name: string; email: string; role: "tech" | "admin" | "client" | "finance" } | undefined }).user;
  
  if (!user) {
    return unauthorized("Authentication required.");
  }

  // Require admin role
  if (user.role !== "admin") {
    return forbidden("Admin access required for data retention execution.");
  }

  const db = getDatabase();
  const executionStart = Date.now();

  try {
    // Verify CSRF token
    const csrfValid = await verifyCsrfRequest(request, user);
    if (!csrfValid) {
      return badRequest("Invalid CSRF token");
    }

    // Parse request body
    let dryRun = false;
    let specificEntityType: string | undefined;

    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json() as {
        dry_run?: boolean;
        entity_type?: string;
      } | undefined;

      if (body) {
        dryRun = body.dry_run ?? false;
        specificEntityType = body.entity_type;
      }
    }

    // Get active policies
    const policies = await getActivePolicies(db);
    
    // Filter to specific entity type if requested
    const policiesToProcess = specificEntityType
      ? policies.filter((p) => p.entity_type === specificEntityType)
      : policies;

    if (policiesToProcess.length === 0) {
      return badRequest(
        specificEntityType
          ? `No active retention policy found for entity type: ${specificEntityType}`
          : "No active retention policies found."
      );
    }

    const results: DeletionResult[] = [];
    const errors: string[] = [];
    let totalRecordsDeleted = 0;

    // Process each policy
    for (const policy of policiesToProcess) {
      const cutoffDate = calculateCutoffDate(policy.retention_days);
      const startTime = Date.now();

      const deletionResult = await deleteExpiredRecords(
        db,
        policy.entity_type,
        cutoffDate,
        dryRun
      );

      const executionDuration = Date.now() - startTime;
      totalRecordsDeleted += deletionResult.deleted;

      results.push({
        entity_type: policy.entity_type,
        records_deleted: deletionResult.deleted,
        batches_processed: deletionResult.batches,
        error: deletionResult.error
      });

      if (deletionResult.error) {
        errors.push(`${policy.entity_type}: ${deletionResult.error}`);
      }

      // Log the operation
      await logRetentionOperation(
        db,
        policy.id,
        policy.entity_type,
        deletionResult.deleted,
        dryRun ? "dry_run" : (deletionResult.error ? "failed" : "completed"),
        deletionResult.error,
        user.email,
        executionDuration
      );
    }

    const totalExecutionTime = Date.now() - executionStart;

    const response: ExecuteRetentionResponse = {
      ok: errors.length === 0,
      dry_run: dryRun,
      executed_at: new Date().toISOString(),
      policies_processed: policiesToProcess.length,
      total_records_deleted: totalRecordsDeleted,
      results,
      errors
    };

    // Audit the operation
    await auditEvent(db, request, {
      eventType: "admin.data_retention.execute",
      entityType: "data_retention_policies",
      entityId: "system",
      outcome: errors.length === 0 ? "success" : "failure",
      user,
      subject: user.email,
      metadata: {
        dryRun,
        policies_processed: policiesToProcess.length,
        total_records_deleted: totalRecordsDeleted,
        execution_time_ms: totalExecutionTime,
        errors: errors.length > 0 ? errors : undefined
      }
    });

    return json(response, {
      status: errors.length > 0 ? 207 : 200 // 207 Multi-Status if partial failures
    });
  } catch (error) {
    const err = error as Error;
    console.error("[DataRetention] POST error:", err);

    await auditEvent(db, request, {
      eventType: "admin.data_retention.execute",
      entityType: "data_retention_policies",
      entityId: "system",
      outcome: "failure",
      user: user ?? null,
      subject: user?.email ?? "unknown",
      metadata: {
        error: err.message,
        name: err.name
      }
    });

    return serverError("Data retention execution failed.");
  }
};

// ============================================================================
// Method Not Allowed Handler
// ============================================================================

export const ALL: APIRoute = () => {
  return methodNotAllowed(["GET", "POST"]);
};
