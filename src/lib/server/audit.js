import { requestFingerprint } from "./request.js";

export async function auditEvent(db, request, options = {}) {
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
