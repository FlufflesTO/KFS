import type { DefectSeverity, DefectStatus } from "../../../../types";
import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.ts";
import { cleanBoolean, cleanId, cleanText, cleanChoice, readJson, requireAdmin } from "../../../../lib/server/access";
import { DefectRepository } from "../../../../lib/server/db/defect-repository";

export const prerender = false;

const severities = ["Critical", "Major", "Minor", "Observation"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];

export async function POST({ request, locals }: import('astro').APIContext) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  let db: ReturnType<typeof getDatabase>;
  try {
    db = getDatabase();
    const defectRepository = new DefectRepository(db);

    const body = await readJson(request);
    const action = String(body.action || "create");

    if (action === "create") {
      const id = crypto.randomUUID();
      const systemId = cleanId(body.systemId, "systemId");
      if (!systemId) return badRequest("systemId is required.");
      const jobId = cleanId(body.jobId, "jobId", { required: false });
      const severity = cleanChoice(body.severity, "severity", severities) as DefectSeverity;
      const sansClauseRef = cleanText(body.sansClauseRef, "sansClauseRef", { required: false, max: 80 });
      const description = cleanText(body.description, "description", { min: 5, max: 2000 });
      const certificateBlocking = cleanBoolean(body.certificateBlocking);
      const status = cleanChoice(body.status || "Open", "status", statuses) as DefectStatus;

      // Verify system exists
      const system = await db
        .prepare(`SELECT id, site_id FROM systems WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`)
        .bind(systemId)
        .first();
      if (!system) {
        return badRequest("System not found.");
      }

      await defectRepository.create({
        id,
        system_id: systemId,
        job_id: jobId,
        severity,
        sans_clause_ref: sansClauseRef || null,
        description,
        certificate_blocking: certificateBlocking,
        status
      });

      // Auto-block valid certificates when a blocking defect is opened
      let certificatesBlocked = 0;
      if (certificateBlocking && status !== "Resolved" && status !== "Closed") {
        certificatesBlocked = await defectRepository.blockCertificates(id, systemId);
      }

      await auditEvent(db, request, {
        eventType: "admin.defect.create",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { systemId, jobId, severity, certificateBlocking: !!certificateBlocking, status, certificatesBlocked }
      });

      return json({ ok: true, id, certificatesBlocked });
    }

    if (action === "update") {
      const id = cleanId(body.id, "id");
      if (!id) return badRequest("id is required.");
      const severity = cleanChoice(body.severity, "severity", severities) as DefectSeverity;
      const sansClauseRef = cleanText(body.sansClauseRef, "sansClauseRef", { required: false, max: 80 });
      const description = cleanText(body.description, "description", { min: 5, max: 2000 });
      const certificateBlocking = cleanBoolean(body.certificateBlocking);
      const status = cleanChoice(body.status, "status", statuses) as DefectStatus;

      // Read current state before updating so we can detect flag changes
      const existing = await defectRepository.findById(id);
      if (!existing) {
        return badRequest("Defect not found.");
      }

      await defectRepository.update(id, {
        severity,
        sans_clause_ref: sansClauseRef || null,
        description,
        certificate_blocking: certificateBlocking,
        status
      });

      const systemId = existing.system_id;
      let certificatesBlocked = 0;
      let certificatesRestored = false;

      const isNowActive = status !== "Resolved" && status !== "Closed";

      if (certificateBlocking && isNowActive) {
        // Defect is/remains blocking and active — (re-)block any Valid certs
        certificatesBlocked = await defectRepository.blockCertificates(id, systemId);
      } else if (!certificateBlocking && existing.certificate_blocking) {
        // Blocking flag was just cleared — restore certs if no other blockers remain
        certificatesRestored = await defectRepository.maybeRestoreCertificates(systemId, id);
      }

      await auditEvent(db, request, {
        eventType: "admin.defect.update",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { severity, status, certificateBlocking: !!certificateBlocking, certificatesBlocked, certificatesRestored }
      });

      return json({ ok: true, id, certificatesBlocked, certificatesRestored });
    }

    if (action === "resolve") {
      const id = cleanId(body.id, "id");
      if (!id) return badRequest("id is required.");
      const remediationNotes = cleanText(body.remediationNotes, "remediationNotes", { required: false, max: 3000 });

      const defect = await defectRepository.findById(id);
      if (!defect) {
        return badRequest("Defect not found.");
      }

      await defectRepository.resolve(id, remediationNotes || null);

      // If this defect was cert-blocking, check if certificates can now be restored
      let certificatesRestored = false;
      if (defect.certificate_blocking) {
        certificatesRestored = await defectRepository.maybeRestoreCertificates(defect.system_id, id);
      }

      await auditEvent(db, request, {
        eventType: "admin.defect.resolve",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { previousStatus: defect.status, certificatesRestored }
      });

      return json({ ok: true, id, status: "Resolved", certificatesRestored });
    }

    if (action === "close") {
      const id = cleanId(body.id, "id");
      if (!id) return badRequest("id is required.");
      const remediationNotes = cleanText(body.remediationNotes, "remediationNotes", { required: false, max: 3000 });

      const defect = await defectRepository.findById(id);
      if (!defect) {
        return badRequest("Defect not found.");
      }

      await defectRepository.close(id, remediationNotes || null);

      // Same certificate restore logic as resolve
      let certificatesRestored = false;
      if (defect.certificate_blocking) {
        certificatesRestored = await defectRepository.maybeRestoreCertificates(defect.system_id, id);
      }

      await auditEvent(db, request, {
        eventType: "admin.defect.close",
        entityType: "defect",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { certificatesRestored }
      });

      return json({ ok: true, id, status: "Closed", certificatesRestored });
    }

    if (action === "quoteRequired") {
      const id = cleanId(body.id, "id");
      if (!id) return badRequest("id is required.");

      const defect = await db
        .prepare(
          `SELECT defects.id, defects.system_id, systems.site_id
           FROM defects
           INNER JOIN systems ON systems.id = defects.system_id
           WHERE defects.deleted_at IS NULL AND systems.deleted_at IS NULL
             AND defects.id = ?1
           LIMIT 1`
        )
        .bind(id)
        .first();
      if (!defect) {
        return badRequest("Defect not found.");
      }

      await db
        .prepare(
          `UPDATE financial_records
             SET finance_task_status = 'Quote Required'
           WHERE site_id = ?1
             AND job_id IN (
               SELECT job_id FROM defects WHERE id = ?2 AND deleted_at IS NULL AND job_id IS NOT NULL
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message) return badRequest(error instanceof Error ? error.message : "Unknown error");
    await auditError(db!, request, error, { user: locals.user, metadata: { message: "admin defects failed" } });
    return serverError("Defect administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
