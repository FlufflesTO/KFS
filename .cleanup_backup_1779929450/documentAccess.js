import { requestFingerprint } from "./request.js";

export async function documentAccessLog(db, request, options = {}) {
  const user = options.user || null;
  const fingerprint = await requestFingerprint(request, options.subject || user?.email || options.storagePath || "");

  await db
    .prepare(
      `INSERT INTO document_access_logs
         (id, actor_user_id, actor_role, site_id, storage_path, document_type, outcome, ip_hash, user_agent, reason)
       VALUES
         (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    )
    .bind(
      crypto.randomUUID(),
      user?.id || null,
      user?.role || null,
      options.siteId || null,
      String(options.storagePath || ""),
      String(options.documentType || "Jobcard PDF"),
      options.outcome || "success",
      fingerprint.ipHash,
      fingerprint.userAgent,
      options.reason || null
    )
    .run();
}
