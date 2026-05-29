// @ts-nocheck
import { auditError } from "../../../lib/server/audit";
import { getDatabase } from "../../../lib/server/bindings.ts";
export const prerender = false;

const visitStatuses = ["Travelling", "Arrived", "In Progress", "Completed", "Unable To Complete", "Follow-up Required", "Quote Required"];
const unableReasons = ["No Access", "Client Unavailable", "Unsafe To Proceed", "Parts Required", "System Isolated", "Quote Required", "Return Visit Required", "Cancelled On Site"];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function cleanId(value: any) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(id)) throw new Error("Job ID is invalid.");
  return id;
}

function cleanTime(value: any, field) {
  const time = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error(`${field} must use HH:MM format.`);
  return time;
}

function cleanDate(value: any) {
  const date = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Visit date must use YYYY-MM-DD format.");
  return date;
}

function cleanOptionalText(value: any, max = 1000) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}

export async function POST({ locals, request }: import('astro').APIContext) {
  const user = locals.user;
  if (!user || user.role !== "tech") {
    return json({ ok: false, message: "Unauthorized." }, 403);
  }

  let body;
  try {
    body = await request.json() as any;
  } catch {
    return json({ ok: false, message: "Invalid JSON." }, 400);
  }

  const { action } = body;
  let jobId;
  try {
    jobId = cleanId(body.jobId);
  } catch (error: any) {
    return json({ ok: false, message: error.message }, 400);
  }

  if (!action || !jobId) {
    return json({ ok: false, message: "Action and jobId are required." }, 400);
  }

  let db;
  try {
    db = getDatabase();
    const jobCheck = await db.prepare(
      `SELECT id, assigned_technician_id, status FROM jobs WHERE deleted_at IS NULL AND id = ?1`
    ).bind(jobId).first();

    if (!jobCheck) return json({ ok: false, message: "Job not found." }, 404);
    if (jobCheck.assigned_technician_id !== user.id) return json({ ok: false, message: "Not assigned to this job." }, 403);

    if (action === "logArrival") {
      const visitDate = cleanDate(body.visitDate);
      const arrivalTime = cleanTime(body.arrivalTime || body.arrivalAt, "Arrival time");
      const gpsLat = body.gpsLat === null || body.gpsLat === undefined || body.gpsLat === "" ? null : Number(body.gpsLat);
      const gpsLng = body.gpsLng === null || body.gpsLng === undefined || body.gpsLng === "" ? null : Number(body.gpsLng);
      if ((gpsLat !== null && !Number.isFinite(gpsLat)) || (gpsLng !== null && !Number.isFinite(gpsLng))) {
        return json({ ok: false, message: "GPS coordinates must be numeric." }, 400);
      }

      const visitId = `visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.prepare(
        `INSERT INTO job_visits (
          id, job_id, technician_id, visit_date, arrival_time,
          gps_latitude, gps_longitude, customer_name, customer_title, notes, visit_status
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'Arrived')`
      ).bind(
        visitId, jobId, user.id, visitDate, arrivalTime,
        gpsLat, gpsLng, cleanOptionalText(body.customerName, 160), cleanOptionalText(body.customerTitle, 80), cleanOptionalText(body.notes, 1000)
      ).run();

      return json({ ok: true, visitId, message: "Arrival logged." });
    }

    if (action === "logOutcome") {
      const visitDate = cleanDate(body.visitDate);
      const departureTime = cleanTime(body.departureTime, "Departure time");
      const visitStatus = String(body.visitStatus || "").trim();
      const unableReason = cleanOptionalText(body.unableReason, 80);
      if (!visitStatuses.includes(visitStatus)) return json({ ok: false, message: "Visit status is invalid." }, 400);
      if (visitStatus === "Unable To Complete" && !unableReasons.includes(unableReason || "")) {
        return json({ ok: false, message: "Unable-to-complete reason is required." }, 400);
      }
      if (unableReason && !unableReasons.includes(unableReason)) return json({ ok: false, message: "Unable-to-complete reason is invalid." }, 400);

      const visitId = `visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.prepare(
        `INSERT INTO job_visits (
          id, job_id, technician_id, visit_date, departure_time,
          notes, visit_status, unable_reason
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      ).bind(
        visitId, jobId, user.id, visitDate, departureTime,
        cleanOptionalText(body.notes, 1000), visitStatus, unableReason
      ).run();

      return json({ ok: true, visitId, message: "Visit outcome logged." });
    }

    return json({ ok: false, message: `Unknown action: ${action}` }, 400);
  } catch (error: any) {
    if (db) {
      await auditError(db, request, error, { user, metadata: { message: "job visit action failed" } });
    }
    return json({ ok: false, message: error.message || "Failed to update visit." }, error.message ? 400 : 500);
  }
}

