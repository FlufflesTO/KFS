import { getBindings } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { forbidden, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.js";

export const prerender = false;

export async function GET({ params, locals, request }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();

    const key = String(params.key || "");
    const isJobcard = key.startsWith("jobcards/") && key.endsWith(".pdf");
    const isEvidence = key.startsWith("job-evidence/") && /\.(jpg|jpeg|png|webp)$/i.test(key);
    if ((!isJobcard && !isEvidence) || key.includes("..")) {
      return forbidden("Invalid document path.");
    }

    const { db, storage } = getBindings();
    const record = isJobcard
      ? await db
        .prepare(
          `SELECT jobs.documentation_path, systems.site_id, jobs.assigned_technician_id
           FROM jobs
           INNER JOIN systems ON systems.id = jobs.system_id
           WHERE jobs.documentation_path = ?1
           LIMIT 1`
        )
        .bind(key)
        .first()
      : await db
        .prepare(
          `SELECT job_evidence_files.storage_path AS documentation_path, systems.site_id, jobs.assigned_technician_id
           FROM job_evidence_files
           INNER JOIN jobs ON jobs.id = job_evidence_files.job_id
           INNER JOIN systems ON systems.id = job_evidence_files.system_id
           WHERE job_evidence_files.storage_path = ?1
           LIMIT 1`
        )
        .bind(key)
        .first();

    if (!record) {
      await auditEvent(db, request, {
        eventType: "document.access",
        entityType: "r2_object",
        entityId: key,
        outcome: "failure",
        user,
        metadata: { reason: "missing_record" }
      });
      return forbidden("Document is not available.");
    }

    const allowed =
      user.role === "admin" ||
      user.role === "finance" ||
      (user.role === "tech" && record.assigned_technician_id === user.id) ||
      (user.role === "client" && record.site_id === user.siteId);

    if (!allowed) {
      await auditEvent(db, request, {
        eventType: "document.access",
        entityType: "r2_object",
        entityId: key,
        outcome: "blocked",
        user,
        metadata: { siteId: record.site_id }
      });
      return forbidden("Document access is not permitted for this account.");
    }

    const object = await storage.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    await auditEvent(db, request, {
      eventType: "document.access",
      entityType: "r2_object",
      entityId: key,
      outcome: "success",
      user,
      metadata: { siteId: record.site_id }
    });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=300");
    headers.set("content-type", headers.get("content-type") || (isJobcard ? "application/pdf" : "application/octet-stream"));

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("document retrieval failed", error);
    return serverError("Document retrieval failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["GET"]);
}
