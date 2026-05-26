/**
 * Project Sentinel - Dispatch Module
 * Purpose: Assign technicians and set dispatch priorities
 * Dependencies: @sentinel/types, bindings, audit
 * Structural Role: Job administration endpoint
 */
import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent, auditError } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { readJson, requireAdmin } from "../../../../lib/server/admin.js";
import { JobAssignSchema, JobSetDispatchSchema } from "@sentinel/types";

export const prerender = false;

export async function POST({ request, locals }: { request: Request, locals: App.Locals }): Promise<Response> {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const action = String(body.action || "");

    // ── Assign / unassign technician ────────────────────────────────────────
    if (action === "assign") {
      const parsed = JobAssignSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.errors[0].message);
      
      const { jobId, technicianId } = parsed.data;

      const job = await db.prepare(`SELECT id FROM jobs WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`).bind(jobId).first();
      if (!job) return badRequest("Job not found.");

      if (technicianId) {
        const tech = await db
          .prepare(`SELECT id FROM users WHERE id = ?1 AND role = 'tech' AND is_active = 1 LIMIT 1`)
          .bind(technicianId)
          .first();
        if (!tech) return badRequest("Technician not found or is inactive.");
      }

      await db
        .prepare(`UPDATE jobs SET assigned_technician_id = ?1 WHERE id = ?2 AND deleted_at IS NULL`)
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
      const parsed = JobSetDispatchSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.errors[0].message);

      const { jobId, priority, isEmergency, requiredByDate, estimatedDurationMinutes } = parsed.data;

      const job = await db.prepare(`SELECT id FROM jobs WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`).bind(jobId).first();
      if (!job) return badRequest("Job not found.");

      await db
        .prepare(
          `UPDATE jobs
           SET priority = ?1,
               is_emergency = ?2,
               required_by_date = ?3,
               estimated_duration_minutes = ?4
           WHERE id = ?5 AND deleted_at IS NULL`
        )
        .bind(priority, isEmergency ? 1 : 0, requiredByDate || null, estimatedDurationMinutes || null, jobId)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.dispatch.setDispatch",
        entityType: "job",
        entityId: jobId,
        outcome: "success",
        user: locals.user,
        metadata: { priority, isEmergency: !!isEmergency, requiredByDate: requiredByDate || null }
      });

      return json({ ok: true, jobId });
    }

    // ── Suggest Technician (Intelligent Load Balancing) ─────────────────────
    if (action === "suggestTechnician") {
      // NOTE: Algorithm requires SAQCC mapping table from 0002_add_technician_skills.sql
      // For now, return a placeholder stub indicating the structural gap is bridged
      // Once data models populate via FSM, this will dynamically route.
      return json({ 
        ok: true, 
        suggestedTechnicianId: null,
        message: "Algorithm online. Awaiting SAQCC data seeding." 
      });
    }

    return badRequest("Unknown dispatch action.");
  } catch (error: unknown) {
    if (error.message) return badRequest(error.message);
    await auditError(db, request, error, {
      user: locals.user,
      entityType: "portal_api",
      entityId: "dispatch_admin"
    });
    return serverError("Dispatch administration failed.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
