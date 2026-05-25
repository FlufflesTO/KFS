import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanBoolean, cleanChoice, cleanId, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

const priorities = ["Critical", "High", "Normal", "Low"];

export async function POST({ request, locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const action = String(body.action || "");

    // ── Assign / unassign technician ────────────────────────────────────────
    if (action === "assign") {
      const jobId = cleanId(body.jobId, "jobId");
      const technicianId = cleanId(body.technicianId, "technicianId", { required: false });

      const job = await db.prepare(`SELECT id FROM jobs WHERE id = ?1 LIMIT 1`).bind(jobId).first();
      if (!job) return badRequest("Job not found.");

      if (technicianId) {
        const tech = await db
          .prepare(`SELECT id FROM users WHERE id = ?1 AND role = 'tech' AND is_active = 1 LIMIT 1`)
          .bind(technicianId)
          .first();
        if (!tech) return badRequest("Technician not found or is inactive.");
      }

      await db
        .prepare(`UPDATE jobs SET assigned_technician_id = ?1 WHERE id = ?2`)
        .bind(technicianId || null, jobId)
        .run();

      await auditEvent(db, request, {
        eventType: technicianId ? "admin.dispatch.assign" : "admin.dispatch.unassign",
        entityType: "job",
        entityId: jobId,
        outcome: "success",
        user: locals.user,
        metadata: { technicianId: technicianId || null }
      });

      return json({ ok: true, jobId, technicianId: technicianId || null });
    }

    // ── Set dispatch priority / SLA / emergency fields ──────────────────────
    if (action === "setDispatch") {
      const jobId = cleanId(body.jobId, "jobId");
      const priority = cleanChoice(body.priority, "priority", priorities);
      const isEmergency = cleanBoolean(body.isEmergency);

      const rawDate = String(body.requiredByDate || "").trim();
      const requiredByDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;

      const rawDur = body.estimatedDurationMinutes;
      const durNum = rawDur !== null && rawDur !== undefined && rawDur !== "" ? parseInt(String(rawDur), 10) : NaN;
      const estimatedDurationMinutes = Number.isInteger(durNum) && durNum >= 1 && durNum <= 480 ? durNum : null;

      const job = await db.prepare(`SELECT id FROM jobs WHERE id = ?1 LIMIT 1`).bind(jobId).first();
      if (!job) return badRequest("Job not found.");

      await db
        .prepare(
          `UPDATE jobs
           SET priority = ?1,
               is_emergency = ?2,
               required_by_date = ?3,
               estimated_duration_minutes = ?4
           WHERE id = ?5`
        )
        .bind(priority, isEmergency, requiredByDate, estimatedDurationMinutes, jobId)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.dispatch.setDispatch",
        entityType: "job",
        entityId: jobId,
        outcome: "success",
        user: locals.user,
        metadata: { priority, isEmergency: !!isEmergency, requiredByDate }
      });

      return json({ ok: true, jobId });
    }

    return badRequest("Unknown dispatch action.");
  } catch (error) {
    if (error.message) return badRequest(error.message);
    console.error("admin dispatch failed", error);
    return serverError("Dispatch administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
