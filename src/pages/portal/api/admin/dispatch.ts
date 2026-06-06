/**
 * Project Sentinel - Dispatch Module
 * Purpose: Assign technicians and set dispatch priorities
 * Dependencies: @sentinel/types, bindings, audit
 * Structural Role: Job administration endpoint
 */
import type { APIContext } from "astro";
import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent, auditError } from "../../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { requireAdmin } from "../../../../lib/server/access.js";

export const prerender = false;

const priorities = new Set(["Critical", "High", "Normal", "Low"]);

interface DispatchBody {
  action?: unknown;
  jobId?: unknown;
  technicianId?: unknown;
  priority?: unknown;
  isEmergency?: unknown;
  requiredByDate?: unknown;
}

function parseBooleanFlag(value: unknown): boolean | null {
  if (value === undefined || value === null || value === "") return null;
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  if (value === false || value === "false" || value === "0" || value === 0) return false;
  return null;
}

function cleanOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new Error("requiredByDate must be a valid YYYY-MM-DD date.");
  }
  return text;
}

async function assertActiveTechnician(db: ReturnType<typeof getDatabase>, technicianId: string): Promise<void> {
  const technician = await db
    .prepare("SELECT id FROM users WHERE id = ?1 AND role = 'tech' AND is_active = 1 AND deleted_at IS NULL LIMIT 1")
    .bind(technicianId)
    .first<{ id: string }>();
  if (!technician) throw new Error("Selected technician is not an active technician account.");
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  let jobIdForAudit = "unknown";
  try {
    const adminError = requireAdmin(locals.user);
    if (adminError) return adminError;

    const body = await request.json() as DispatchBody;
    const action = String(body.action || "").trim();
    const jobId = String(body.jobId || "").trim();
    jobIdForAudit = jobId || "unknown";

    if (!["assign", "unassign", "setDispatch"].includes(action)) return badRequest("Dispatch action is invalid.");
    if (!jobId) return badRequest("Job ID is required.");

    const db = getDatabase();
    const job = await db
      .prepare("SELECT id FROM jobs WHERE id = ?1 AND deleted_at IS NULL LIMIT 1")
      .bind(jobId)
      .first<{ id: string }>();
    if (!job) return badRequest("Job not found.");

    const setClauses: string[] = [];
    const bindValues: (string | number | null)[] = [];
    const metadata: Record<string, unknown> = { action };

    if (action === "assign") {
      const technicianId = String(body.technicianId || "").trim();
      if (!technicianId) return badRequest("Technician ID is required for assignment.");
      await assertActiveTechnician(db, technicianId);
      setClauses.push("assigned_technician_id = ?");
      bindValues.push(technicianId);
      metadata.technicianId = technicianId;
    }

    if (action === "unassign") {
      setClauses.push("assigned_technician_id = NULL");
      metadata.technicianId = null;
    }

    if (body.priority !== undefined) {
      const priority = String(body.priority || "").trim();
      if (!priorities.has(priority)) return badRequest("Priority must be one of: Critical, High, Normal, Low.");
      setClauses.push("priority = ?");
      bindValues.push(priority);
      metadata.priority = priority;
    }

    if (body.isEmergency !== undefined) {
      const emergency = parseBooleanFlag(body.isEmergency);
      if (emergency === null) return badRequest("isEmergency must be a boolean-like value.");
      setClauses.push("is_emergency = ?");
      bindValues.push(emergency ? 1 : 0);
      metadata.isEmergency = emergency;
    }

    try {
      const requiredByDate = cleanOptionalDate(body.requiredByDate);
      if (requiredByDate !== undefined) {
        setClauses.push("required_by_date = ?");
        bindValues.push(requiredByDate);
        metadata.requiredByDate = requiredByDate;
      }
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "requiredByDate is invalid.");
    }

    if (setClauses.length === 0) return badRequest("No dispatch changes were provided.");

    setClauses.push("updated_at = CURRENT_TIMESTAMP");
    await db
      .prepare(`UPDATE jobs SET ${setClauses.join(", ")} WHERE id = ?`)
      .bind(...bindValues, jobId)
      .run();

    await auditEvent(db, request, {
      eventType: `admin.dispatch.${action}`,
      entityType: "job",
      entityId: jobId,
      outcome: "success",
      user: locals.user,
      subject: locals.user!.email || "unknown",
      metadata
    });

    return json({ ok: true, message: "Job dispatched successfully." });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Selected technician")) return badRequest(error.message);

    const db = getDatabase();
    await auditError(db, request, error as Error, {
      entityType: "admin_dispatch_api",
      entityId: jobIdForAudit
    });
    return serverError("Dispatch could not be processed.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
