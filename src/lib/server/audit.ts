/**
 * Project Sentinel - Forensic Audit Trail Services
 * Purpose: Inserts administrative, security, and financial events into the auth_audit/ledger tables
 * Dependencies: ./request.js
 * Structural Role: Forensic audit log writer and security compliance tracker
 */

import { requestFingerprint } from "./request.js";
import type { D1Database } from "@cloudflare/workers-types";
import type { SessionUser } from "./auth.js";

export interface AuditOptions {
  user?: SessionUser | null | undefined;
  subject?: string;
  metadata?: Record<string, unknown> | null;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  outcome?: string;
}

export async function auditEvent(db: D1Database, request: Request, options: AuditOptions = {}): Promise<void> {
  try {
    const user = options.user || null;
    const fingerprint = await requestFingerprint(request, options.subject || user?.email || "");
    const metadata = options.metadata ? JSON.stringify(options.metadata).slice(0, 4000) : null;

    await db
      .prepare(
        `INSERT INTO audit_events
           (id, actor_user_id, actor_role, event_type, entity_type, entity_id, outcome, ip_hash, user_agent, metadata_json)
         VALUES
           (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
      )
      .bind(
        crypto.randomUUID(),
        user?.id || null,
        user?.role || null,
        String(options.eventType || "portal.event"),
        String(options.entityType || "portal"),
        options.entityId ? String(options.entityId) : null,
        options.outcome || "success",
        fingerprint.ipHash,
        fingerprint.userAgent,
        metadata
      )
      .run();
  } catch (error) {
    console.error("audit event write failed", error);
  }
}

export async function auditError(db: D1Database, request: Request, error: unknown, options: AuditOptions = {}): Promise<void> {
  try {
    const user = options.user || null;
    const fingerprint = await requestFingerprint(request, user?.email || "");
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'UnknownError',
      path: new URL(request.url).pathname,
      ...(options.metadata || {})
    };
    
    // Log securely to database, never exposing stack traces to the client
    await db
      .prepare(
        `INSERT INTO audit_events
           (id, actor_user_id, actor_role, event_type, entity_type, entity_id, outcome, ip_hash, user_agent, metadata_json)
         VALUES
           (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
      )
      .bind(
        crypto.randomUUID(),
        user?.id || null,
        user?.role || null,
        "security.error",
        String(options.entityType || "system"),
        options.entityId ? String(options.entityId) : "fatal",
        "error",
        fingerprint.ipHash,
        fingerprint.userAgent,
        JSON.stringify(errorDetails).slice(0, 4000)
      )
      .run();
  } catch (err) {
    console.error("audit error write failed", err);
  }
}
