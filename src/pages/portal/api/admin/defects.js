import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanBoolean, cleanId, cleanText, cleanChoice, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

const severities = ["Critical", "Major", "Minor", "Observation"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];

export async function POST({ request, locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const action = String(body.action || "create");

    if (action === "create") {
      const id = crypto.randomUUID();
      const systemId = cleanId(body.systemId, "systemId");
      const jobId = cleanId(body.jobId, "jobId", { required: false });
      const severity = cleanChoice(body.severity, "severity", severities);
      const sansClauseRef = cleanText(body.sansClauseRef, "sansClauseRef", { required: false, max: 80 });
      const description = cleanText(body.description, "description", { min: 5, max: 2000 });
      const certificateBlocking = cleanBoolean(body.certificateBlocking);
      const status = cleanChoice(body.status || "Open", "status", statuses);

      await db
        .prepare(
          `INSERT INTO defects
             (id, system_id, job_id, severity, sans_clause_ref, description, certificate_blocking, status)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        )
        .bind(id, systemId, jobId, severity, sansClauseRef || null, description, certificateBlocking, status)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.defect.create",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { systemId, jobId, severity, certificateBlocking: !!certificateBlocking, status }
      });

      return json({ ok: true, id });
    }

    if (action === "update") {
      const id = cleanId(body.id, "id");
      const severity = cleanChoice(body.severity, "severity", severities);
      const sansClauseRef = cleanText(body.sansClauseRef, "sansClauseRef", { required: false, max: 80 });
      const description = cleanText(body.description, "description", { min: 5, max: 2000 });
      const certificateBlocking = cleanBoolean(body.certificateBlocking);
      const status = cleanChoice(body.status, "status", statuses);

      await db
        .prepare(
          `UPDATE defects
           SET severity = ?1,
               sans_clause_ref = ?2,
               description = ?3,
               certificate_blocking = ?4,
               status = ?5
           WHERE id = ?6`
        )
        .bind(severity, sansClauseRef || null, description, certificateBlocking, status, id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.defect.update",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { severity, status, certificateBlocking: !!certificateBlocking }
      });

      return json({ ok: true, id });
    }

    if (action === "resolve") {
      const id = cleanId(body.id, "id");
      const remediationNotes = cleanText(body.remediationNotes, "remediationNotes", { required: false, max: 3000 });

      const defect = await db
        .prepare(`SELECT id, status FROM defects WHERE id = ?1 LIMIT 1`)
        .bind(id)
        .first();
      if (!defect) return badRequest("Defect not found.");

      await db
        .prepare(
          `UPDATE defects
           SET status = 'Resolved',
               remediation_notes = ?1
           WHERE id = ?2`
        )
        .bind(remediationNotes || null, id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.defect.resolve",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { previousStatus: defect.status }
      });

      return json({ ok: true, id, status: "Resolved" });
    }

    if (action === "close") {
      const id = cleanId(body.id, "id");
      const remediationNotes = cleanText(body.remediationNotes, "remediationNotes", { required: false, max: 3000 });

      await db
        .prepare(
          `UPDATE defects
           SET status = 'Closed',
               remediation_notes = ?1
           WHERE id = ?2`
        )
        .bind(remediationNotes || null, id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.defect.close",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: {}
      });

      return json({ ok: true, id, status: "Closed" });
    }

    if (action === "quoteRequired") {
      const id = cleanId(body.id, "id");

      const defect = await db
        .prepare(
          `SELECT defects.id, defects.system_id, systems.site_id
           FROM defects
           INNER JOIN systems ON systems.id = defects.system_id
           WHERE defects.id = ?1
           LIMIT 1`
        )
        .bind(id)
        .first();
      if (!defect) return badRequest("Defect not found.");

      await db
        .prepare(
          `UPDATE financial_records
           SET finance_task_status = 'Quote Required'
           WHERE site_id = ?1
             AND job_id IN (
               SELECT job_id FROM defects WHERE id = ?2 AND job_id IS NOT NULL
             )
             AND finance_task_status = 'Invoice Required'`
        )
        .bind(defect.site_id, id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.defect.quoteRequired",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { siteId: defect.site_id }
      });

      return json({ ok: true, id });
    }

    return badRequest("Unknown defect action.");
  } catch (error) {
    if (error.message) return badRequest(error.message);
    console.error("admin defects failed", error);
    return serverError("Defect administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
