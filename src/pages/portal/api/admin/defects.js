import { auditError } from "../../../../lib/server/audit.js";
import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanBoolean, cleanId, cleanText, cleanChoice, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

const severities = ["Critical", "Major", "Minor", "Observation"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];

// ─── Certificate eligibility helpers ──────────────────────────────────────────

/**
 * When a certificate-blocking defect goes active, block any Valid certificates
 * on the same system and record this defect as the blocker.
 */
async function autoBlockCertificates(db, defectId, systemId) {
  await db
    .prepare(
      `UPDATE certificates
         SET status = 'Blocked',
             blocked_by_defect_id = ?1
       WHERE system_id = ?2
         AND status = 'Valid'
         AND deleted_at IS NULL`
    )
    .bind(defectId, systemId)
    .run();
}

/**
 * When a cert-blocking defect is resolved/closed OR its certificate_blocking
 * flag is cleared, check if any other open blocking defects remain for the
 * system. If none remain, restore Blocked certificates to Valid.
 */
async function maybeRestoreCertificates(db, systemId, excludeDefectId) {
  const remainingBlocker = await db
    .prepare(
      `SELECT id FROM defects
        WHERE system_id = ?1
          AND deleted_at IS NULL
          AND certificate_blocking = 1
          AND status IN ('Open', 'In Progress')
          AND id != ?2
        LIMIT 1`
    )
    .bind(systemId, excludeDefectId)
    .first();

  if (!remainingBlocker) {
    await db
      .prepare(
        `UPDATE certificates
           SET status = 'Valid',
               blocked_by_defect_id = NULL
         WHERE system_id = ?1
           AND status = 'Blocked'
           AND deleted_at IS NULL`
      )
      .bind(systemId)
      .run();
    return true; // certificates were restored
  }
  return false; // still blocked by another defect
}

// ─── POST handler ──────────────────────────────────────────────────────────────

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

      // Auto-block valid certificates when a blocking defect is opened
      let certificatesBlocked = 0;
      if (certificateBlocking && status !== "Resolved" && status !== "Closed") {
        const before = await db
          .prepare(`SELECT COUNT(*) AS n FROM certificates WHERE system_id = ?1 AND status = 'Valid' AND deleted_at IS NULL`)
          .bind(systemId)
          .first();
        await autoBlockCertificates(db, id, systemId);
        certificatesBlocked = before?.n ?? 0;
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
      const severity = cleanChoice(body.severity, "severity", severities);
      const sansClauseRef = cleanText(body.sansClauseRef, "sansClauseRef", { required: false, max: 80 });
      const description = cleanText(body.description, "description", { min: 5, max: 2000 });
      const certificateBlocking = cleanBoolean(body.certificateBlocking);
      const status = cleanChoice(body.status, "status", statuses);

      // Read current state before updating so we can detect flag changes
      const existing = await db
        .prepare(`SELECT system_id, certificate_blocking FROM defects WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`)
        .bind(id)
        .first();
      if (!existing) return badRequest("Defect not found.");

      await db
        .prepare(
          `UPDATE defects
             SET severity = ?1,
                 sans_clause_ref = ?2,
                 description = ?3,
                 certificate_blocking = ?4,
                 status = ?5
           WHERE id = ?6 AND deleted_at IS NULL`
        )
        .bind(severity, sansClauseRef || null, description, certificateBlocking, status, id)
        .run();

      const systemId = existing.system_id;
      let certificatesBlocked = 0;
      let certificatesRestored = false;

      const isNowActive = status !== "Resolved" && status !== "Closed";

      if (certificateBlocking && isNowActive) {
        // Defect is/remains blocking and active — (re-)block any Valid certs
        const before = await db
          .prepare(`SELECT COUNT(*) AS n FROM certificates WHERE system_id = ?1 AND status = 'Valid' AND deleted_at IS NULL`)
          .bind(systemId)
          .first();
        await autoBlockCertificates(db, id, systemId);
        certificatesBlocked = before?.n ?? 0;
      } else if (!certificateBlocking && existing.certificate_blocking) {
        // Blocking flag was just cleared — restore certs if no other blockers remain
        certificatesRestored = await maybeRestoreCertificates(db, systemId, id);
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
      const remediationNotes = cleanText(body.remediationNotes, "remediationNotes", { required: false, max: 3000 });

      const defect = await db
        .prepare(`SELECT id, status, system_id, certificate_blocking FROM defects WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`)
        .bind(id)
        .first();
      if (!defect) return badRequest("Defect not found.");

      await db
        .prepare(
          `UPDATE defects
             SET status = 'Resolved',
                 remediation_notes = ?1
           WHERE id = ?2 AND deleted_at IS NULL`
        )
        .bind(remediationNotes || null, id)
        .run();

      // If this defect was cert-blocking, check if certificates can now be restored
      let certificatesRestored = false;
      if (defect.certificate_blocking) {
        certificatesRestored = await maybeRestoreCertificates(db, defect.system_id, id);
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
      const remediationNotes = cleanText(body.remediationNotes, "remediationNotes", { required: false, max: 3000 });

      const defect = await db
        .prepare(`SELECT id, status, system_id, certificate_blocking FROM defects WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`)
        .bind(id)
        .first();
      if (!defect) return badRequest("Defect not found.");

      await db
        .prepare(
          `UPDATE defects
             SET status = 'Closed',
                 remediation_notes = ?1
           WHERE id = ?2 AND deleted_at IS NULL`
        )
        .bind(remediationNotes || null, id)
        .run();

      // Same certificate restore logic as resolve
      let certificatesRestored = false;
      if (defect.certificate_blocking) {
        certificatesRestored = await maybeRestoreCertificates(db, defect.system_id, id);
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
      if (!defect) return badRequest("Defect not found.");

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
  } catch (error) {
    if (error.message) return badRequest(error.message);
    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "admin defects failed" } });
    return serverError("Defect administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
