import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

function cleanId(value, fieldName) {
  const normalized = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(normalized)) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return normalized;
}

export async function POST({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (user.role !== "tech") return forbidden("Only technician accounts can update dispatch status from the field workspace.");

    const body = await request.json();
    const jobId = cleanId(body.jobId, "jobId");
    const status = String(body.status || "").trim();

    if (status !== "In Progress") {
      return badRequest("Only transition to In Progress is supported from the technician workspace.");
    }

    const db = getDatabase();
    const job = await db
      .prepare(
        `SELECT id, assigned_technician_id, status
         FROM jobs
         WHERE id = ?1
         LIMIT 1`
      )
      .bind(jobId)
      .first();

    if (!job) return badRequest("The requested job was not found.");
    if (job.status !== "Scheduled") return badRequest("Only scheduled jobs can be started.", { currentStatus: job.status });
    if (user.role === "tech" && job.assigned_technician_id !== user.id) {
      await auditEvent(db, request, {
        eventType: "job.status",
        entityType: "job",
        entityId: jobId,
        outcome: "blocked",
        user,
        metadata: { reason: "wrong_technician", requestedStatus: status }
      });
      return forbidden("This job is not assigned to the authenticated technician.");
    }

    await db.prepare(`UPDATE jobs SET status = 'In Progress' WHERE id = ?1`).bind(jobId).run();
    await auditEvent(db, request, {
      eventType: "job.status",
      entityType: "job",
      entityId: jobId,
      outcome: "success",
      user,
      metadata: { status }
    });

    return json({ ok: true, jobId, status });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest("Request body must be valid JSON.");
    if (error.message) return badRequest(error.message);
    console.error("job status update failed", error);
    return serverError("The job status could not be updated.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
