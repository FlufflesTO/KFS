import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.ts";
import { cleanChoice, cleanDate, cleanId, cleanText, readJson, requireAdmin } from "../../../../lib/server/access";

export const prerender = false;

const statuses = ["New", "Reviewing", "Scheduled", "Closed"];

export async function POST({ request, locals }: import('astro').APIContext) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  let db: ReturnType<typeof getDatabase>;
  try {
    db = getDatabase();

    const body = await readJson(request);
    const action = cleanChoice(body.action || "updateStatus", "action", ["updateStatus", "scheduleDispatch"]);
    const requestId = cleanId(body.requestId, "requestId");
    if (!requestId) return badRequest("requestId is required.");

    const maintenanceRequest = await db
      .prepare(
        `SELECT id, site_id, system_id, request_type, priority, subject, message, status, linked_job_id
         FROM maintenance_requests
         WHERE id = ?1
         LIMIT 1`
      )
      .bind(requestId)
      .first();

    if (!maintenanceRequest) return badRequest("Maintenance request was not found.");

    if (action === "updateStatus") {
      const status = cleanChoice(body.status, "status", statuses);
      await db.prepare(`UPDATE maintenance_requests SET status = ?1 WHERE id = ?2`).bind(status, requestId).run();
      await auditEvent(db, request, {
        eventType: "maintenance_request.status",
        entityType: "maintenance_request",
        entityId: requestId,
        outcome: "success",
        user: locals.user,
        metadata: { status }
      });
      return json({ ok: true, requestId, status });
    }

    if (maintenanceRequest.linked_job_id) {
      return badRequest("This request is already linked to a scheduled dispatch.", { linkedJobId: maintenanceRequest.linked_job_id });
    }

    const systemId = cleanId(body.systemId || maintenanceRequest.system_id, "systemId");
    const assignedTechnicianId = cleanId(body.assignedTechnicianId, "assignedTechnicianId", { required: false });
    const scheduledDate = cleanDate(body.scheduledDate, "scheduledDate");
    const jobType = cleanText(body.jobType || maintenanceRequest.request_type, "jobType", { min: 2, max: 80 });
    const siteNotes = cleanText(
      body.siteNotes || `${maintenanceRequest.subject}: ${maintenanceRequest.message}`,
      "siteNotes",
      { min: 3, max: 1000 }
    );

    const system = await db
      .prepare(`SELECT id FROM systems WHERE deleted_at IS NULL AND id = ?1 AND site_id = ?2 LIMIT 1`)
      .bind(systemId, maintenanceRequest.site_id)
      .first();
    if (!system) return badRequest("Selected system does not belong to the request site.");

    const jobId = crypto.randomUUID();
    await db.batch([
      db
        .prepare(
          `INSERT INTO jobs
             (id, system_id, assigned_technician_id, scheduled_date, status, job_type, site_notes)
           VALUES
             (?1, ?2, ?3, ?4, 'Scheduled', ?5, ?6)`
        )
        .bind(jobId, systemId, assignedTechnicianId, scheduledDate, jobType, siteNotes),
      db
        .prepare(`UPDATE maintenance_requests SET status = 'Scheduled', linked_job_id = ?1 WHERE id = ?2`)
        .bind(jobId, requestId)
    ]);

    await auditEvent(db, request, {
      eventType: "maintenance_request.schedule",
      entityType: "maintenance_request",
      entityId: requestId,
      outcome: "success",
      user: locals.user,
      metadata: { jobId, systemId, assignedTechnicianId, scheduledDate }
    });

    return json({ ok: true, requestId, jobId, status: "Scheduled" });
  } catch (error: any) {
    if (error.message) return badRequest(error.message);
    await auditError(db!, request, error, { user: locals.user, metadata: { message: "admin maintenance request failed" } });
    return serverError("Maintenance request administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
