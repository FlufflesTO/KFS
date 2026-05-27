/**
 * Project Sentinel - Audit Event Logging
 * Purpose: Records security events, user actions, and system activities for compliance and monitoring
 * Dependencies: ./request.js
 * Structural Role: Activity logging layer
 */

import type { D1Database } from "@cloudflare/workers-types";

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
  subject: string;
  metadata?: Record<string, unknown>;
}

export interface AuditError {
  entityType: string;
  entityId: string;
}

export async function auditEvent(db: D1Database, request: Request, event: AuditEvent): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO audit_log (
        event_type, entity_type, entity_id, outcome, user_id, user_name, user_email, user_role, 
        subject, metadata, ip_address, user_agent, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      event.eventType,
      event.entityType,
      event.entityId,
      event.outcome,
      event.user?.id || null,
      event.user?.name || null,
      event.user?.email || null,
      event.user?.role || null,
      event.subject,
      event.metadata ? JSON.stringify(event.metadata) : null,
      request.headers.get("cf-connecting-ip") || null,
      request.headers.get("user-agent") || null
    ).run();
  } catch (error) {
    console.error("Audit event logging failed", error);
  }
}

export async function auditError(db: D1Database, request: Request, error: unknown, context: AuditError): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO audit_log (
        event_type, entity_type, entity_id, outcome, subject, metadata, ip_address, user_agent, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      "system.error",
      context.entityType,
      context.entityId,
      "failure",
      "system",
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      request.headers.get("cf-connecting-ip") || null,
      request.headers.get("user-agent") || null
    ).run();
  } catch (logError) {
    console.error("Audit error logging failed", logError);
  }
}