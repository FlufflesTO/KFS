
import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.ts";
import { cleanDate, cleanId, cleanText, cleanChoice, readJson, requireAdmin } from "../../../../lib/server/access";

export const prerender = false;

const certificateTypes = ["Fire Detection", "Gas Suppression", "Emergency Lighting", "Evacuation", "Combined"];
const certificateStatuses = ["Valid", "Expired", "Revoked", "Blocked"];

export async function POST({ request, locals }: import('astro').APIContext) {
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
      const certificateType = cleanChoice(body.certificateType, "certificateType", certificateTypes);
      const issuedDate = cleanDate(body.issuedDate, "issuedDate");
      const expiryDate = cleanDate(body.expiryDate, "expiryDate");
      const status = cleanChoice(body.status || "Valid", "status", certificateStatuses);
      const blockedByDefectId = cleanId(body.blockedByDefectId, "blockedByDefectId", { required: false });

      // If issuing a Valid certificate, check for open blocking defects
      if (status === "Valid") {
        const blockingDefect = await db
          .prepare(
            `SELECT id, severity, description FROM defects
             WHERE deleted_at IS NULL
               AND system_id = ?1
               AND certificate_blocking = 1
               AND status IN ('Open', 'In Progress')
             LIMIT 1`
          )
          .bind(systemId)
          .first();

        if (blockingDefect) {
          return badRequest(
            `Cannot issue a Valid certificate: open blocking defect "${blockingDefect.severity}" — ${blockingDefect.description}. Resolve the defect or create the certificate as Blocked.`
          );
        }
      }

      await db
        .prepare(
          `INSERT INTO certificates
             (id, system_id, job_id, certificate_type, issued_date, expiry_date, blocked_by_defect_id, status)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        )
        .bind(id, systemId, jobId, certificateType, issuedDate, expiryDate || null, blockedByDefectId || null, status)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.certificate.create",
        entityType: "certificate",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { systemId, jobId, certificateType, status, expiryDate }
      });

      return json({ ok: true, id });
    }

    if (action === "update") {
      const id = cleanId(body.id, "id");
      const expiryDate = cleanDate(body.expiryDate, "expiryDate");

      const cert = await db
        .prepare(`SELECT id, status FROM certificates WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`)
        .bind(id)
        .first();
      if (!cert) return badRequest("Certificate not found.");

      await db
        .prepare(
          `UPDATE certificates
           SET expiry_date = ?1
           WHERE id = ?2 AND deleted_at IS NULL`
        )
        .bind(expiryDate || null, id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.certificate.update",
        entityType: "certificate",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { expiryDate, previousStatus: cert.status }
      });

      return json({ ok: true, id });
    }

    if (action === "revoke") {
      const id = cleanId(body.id, "id");

      await db
        .prepare(`UPDATE certificates SET status = 'Revoked' WHERE id = ?1 AND deleted_at IS NULL`)
        .bind(id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.certificate.revoke",
        entityType: "certificate",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: {}
      });

      return json({ ok: true, id, status: "Revoked" });
    }

    if (action === "expire") {
      const id = cleanId(body.id, "id");

      await db
        .prepare(`UPDATE certificates SET status = 'Expired' WHERE id = ?1 AND deleted_at IS NULL`)
        .bind(id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.certificate.expire",
        entityType: "certificate",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: {}
      });

      return json({ ok: true, id, status: "Expired" });
    }

    return badRequest("Unknown certificate action.");
  } catch (error: any) {
    if (error.message) return badRequest(error.message);
    await auditError(typeof db !== 'undefined' ? db : getDatabase(), request, error, { user: typeof user !== 'undefined' ? user : null, metadata: { message: "admin certificates failed" } });
    return serverError("Certificate administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}

