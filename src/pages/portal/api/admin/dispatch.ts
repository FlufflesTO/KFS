/**
 * Project Sentinel - Dispatch Module
 * Purpose: Assign technicians and set dispatch priorities
 * Dependencies: @sentinel/types, bindings, audit
 * Structural Role: Job administration endpoint
 */
import type { APIContext } from "astro";
// Removed unused import: import type { D1Database } from "@cloudflare/workers-types";
import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent, auditError } from "../../../../lib/server/audit";
// Removed import of requireRole since it doesn't exist
import { badRequest, json, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.js";

export const prerender = false;

export async function POST({ params, request, locals }: APIContext): Promise<Response> {
  try {
    // Check role manually since requireRole is not available
    if (!locals.user || locals.user.role !== "admin") {
      return unauthorized("Admin access required.");
    }

    const body = await request.json() as Record<string, any>;
    const technicianId = body.technicianId;
    const priority = body.priority;
    const isEmergency = body.isEmergency;
    const requiredByDate = body.requiredByDate;
    const jobId = params.jobId;

    if (!jobId) {
      return badRequest("Job ID is required.");
    }

    if (technicianId !== null && typeof technicianId !== "string") {
      return badRequest("Technician ID must be a string or null.");
    }

    if (!priority || !["Critical", "High", "Normal", "Low"].includes(priority)) {
      return badRequest("Priority must be one of: Critical, High, Normal, Low.");
    }

    if (typeof isEmergency !== "boolean") {
      return badRequest("isEmergency must be a boolean.");
    }

    if (requiredByDate && isNaN(Date.parse(requiredByDate))) {
      return badRequest("requiredByDate must be a valid ISO date string.");
    }

    const db = getDatabase();
    const job = await db.prepare("SELECT id FROM jobs WHERE id = ?").bind(jobId).first();

    if (!job) {
      return badRequest("Job not found.");
    }

    await db.prepare(
      "UPDATE jobs SET assigned_technician_id = ?, priority = ?, is_emergency = ?, required_by_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(technicianId, priority, isEmergency ? 1 : 0, requiredByDate || null, jobId).run();

    if (locals.user) {
      await auditEvent(db, request, {
        eventType: technicianId ? "admin.dispatch.assign" : "admin.dispatch.unassign",
        entityType: "job",
        entityId: jobId,
        outcome: "success",
        user: locals.user,
        subject: locals.user.email || "unknown",
        metadata: { technicianId: technicianId || null }
      });
    }

    if (locals.user) {
      await auditEvent(db, request, {
        eventType: "admin.dispatch.setDispatch",
        entityType: "job",
        entityId: jobId,
        outcome: "success",
        user: locals.user,
        subject: locals.user.email || "unknown",
        metadata: { priority, isEmergency: !!isEmergency, requiredByDate: requiredByDate || null }
      });
    }

    return json({ ok: true, message: "Job dispatched successfully." });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return unauthorized(error.message);
    }

    const db = getDatabase();
    await auditError(db, request, error, {
      entityType: "admin_dispatch_api",
      entityId: params.jobId || "unknown"
    });
    return serverError("Dispatch could not be processed.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
