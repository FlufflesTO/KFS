/**
 * Project Sentinel - Audit Event Logging
 * Purpose: Records security events, user actions, and system activities for compliance and monitoring
 * Dependencies: ./request.js
 * Structural Role: Activity logging layer
 */

import type { D1Database } from "@cloudflare/workers-types";
// @ts-ignore - cloudflare:workers module is not available in standard TypeScript definitions
import { env } from "cloudflare:workers";

const textEncoder = new TextEncoder();

/**
 * Anonymizes IP addresses using SHA-256 hashing with a salt.
 * Complies with POPIA data minimization requirements by storing only hashed IPs.
 */
async function hashIpAddress(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  
  // @ts-ignore - env might not be typed in standard TypeScript
  const salt = String(env.AUDIT_IP_SALT || env.SESSION_SECRET || "default-audit-salt");
  const combined = `${ip}|${salt}`;
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", textEncoder.encode(combined));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface AuditEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  outcome: "success" | "failure" | "blocked";
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    siteId?: string | null;
  } | null;
  subject?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditError {
  entityType?: string;
  entityId?: string;
  user?: AuditEvent["user"];
  metadata?: Record<string, unknown>;
}

export async function auditEvent(db: D1Database, request: Request, event: AuditEvent): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const actorUserId = event.user?.id || null;
    const actorRole = event.user?.role || null;
    const validRoles = ["tech", "admin", "client", "finance"];
    const sanitizedRole = actorRole && validRoles.includes(actorRole) ? actorRole : null;

    // Hash IP address for POPIA compliance - never store plain-text IPs
    const ipHash = await hashIpAddress(request.headers.get("cf-connecting-ip"));

    await db.prepare(`
      INSERT INTO audit_events (
        id, actor_user_id, actor_role, event_type, entity_type, entity_id, outcome, ip_hash, user_agent, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      actorUserId,
      sanitizedRole,
      event.eventType,
      event.entityType,
      event.entityId || null,
      event.outcome,
      ipHash,
      request.headers.get("user-agent") || null,
      event.metadata ? JSON.stringify(event.metadata) : null
    ).run();
  } catch (error) {
    console.error("Audit event logging failed", error);
  }
}

export async function auditError(db: D1Database, request: Request, error: unknown, context: AuditError): Promise<void> {
  try {
    const id = crypto.randomUUID();
    
    // Hash IP address for POPIA compliance - never store plain-text IPs
    const ipHash = await hashIpAddress(request.headers.get("cf-connecting-ip"));
    
    await db.prepare(`
      INSERT INTO audit_events (
        id, actor_user_id, actor_role, event_type, entity_type, entity_id, outcome, ip_hash, user_agent, metadata_json
      ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      "system.error",
      context.entityType || "system",
      context.entityId || null,
      "failure",
      ipHash,
      request.headers.get("user-agent") || null,
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      })
    ).run();
  } catch (logError) {
    console.error("Audit error logging failed", logError);
  }
}

export interface DocumentAccessLogOptions {
  user?: {
    id: string;
    role: string;
    email: string;
  } | null;
  siteId?: string | null;
  storagePath?: string;
  documentType?: string;
  outcome?: "success" | "failure" | "blocked";
  reason?: string | null;
}

export async function documentAccessLog(
  db: D1Database,
  request: Request,
  options: DocumentAccessLogOptions = {}
): Promise<void> {
  const user = options.user || null;
  
  // Hash IP address for POPIA compliance - never store plain-text IPs
  const ipHash = await hashIpAddress(request.headers.get("cf-connecting-ip"));
  const userAgent = request.headers.get("user-agent") || null;

  try {
    await db
      .prepare(
        `INSERT INTO document_access_logs
           (id, actor_user_id, actor_role, site_id, storage_path, document_type, outcome, ip_hash, user_agent, reason)
         VALUES
           (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        user?.id || null,
        user?.role || null,
        options.siteId || null,
        options.storagePath || "",
        options.documentType || "Jobcard PDF",
        options.outcome || "success",
        ipHash,
        userAgent,
        options.reason || null
      )
      .run();
  } catch (error) {
    console.error("Document access logging failed", error);
  }
}
