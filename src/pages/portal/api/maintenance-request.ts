
import { auditError } from "../../../lib/server/audit";
import { getDatabase } from "../../../lib/server/bindings.ts";
import { auditEvent } from "../../../lib/server/audit";
import { clientCanAccessSite, clientSiteIds } from "../../../lib/server/access";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.ts";

export const prerender = false;

const requestTypes = ["Maintenance", "Fault", "Compliance Documentation", "Quote Request", "Emergency Follow-up"];
const priorities = ["Routine", "Urgent", "Critical"];

function cleanText(value: any, _fieldName: string, { min = 1, max = 2000 } = {}) {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) {
    throw new Error(`${_fieldName} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function cleanChoice(value: any, _fieldName: string, choices: string[]) {
  const normalized = cleanText(value, _fieldName, { min: 1, max: 80 });
  if (!choices.includes(normalized)) throw new Error(`${_fieldName} is invalid.`);
  return normalized;
}

function cleanOptionalId(value: any, _fieldName: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(normalized)) throw new Error(`${_fieldName} is invalid.`);
  return normalized;
}

export async function POST({ request, locals }: import('astro').APIContext) {
  const user = locals.user;
  if (!user) return unauthorized();
  if (user.role !== "client") return forbidden("Only client accounts can submit maintenance requests.");

  let db;
  try {
    db = getDatabase();
  } catch {
    return serverError("Service temporarily unavailable.");
  }

  try {
    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const requestedSiteId = cleanOptionalId(body.siteId, "siteId");
    const systemId = cleanOptionalId(body.systemId, "systemId");
    const requestType = cleanChoice(body.requestType, "requestType", requestTypes);
    const priority = cleanChoice(body.priority || "Routine", "priority", priorities);
    const subject = cleanText(body.subject, "subject", { min: 3, max: 160 });
    const message = cleanText(body.message, "message", { min: 10, max: 2000 });
    const db = getDatabase();
    const accessibleSites = await clientSiteIds(db, user);
    if (accessibleSites.length === 0) return badRequest("This client account is not mapped to a site.");

    let siteId = requestedSiteId || user.siteId || accessibleSites[0];
    if (!(await clientCanAccessSite(db, user, siteId))) {
      return forbidden("The selected site is not available to this client account.");
    }

    if (systemId) {
      const system = await db
        .prepare(`SELECT id, site_id FROM systems WHERE deleted_at IS NULL AND id = ?1 AND site_id = ?2 LIMIT 1`)
        .bind(systemId, siteId)
        .first();
      if (!system) return forbidden("The selected system is not available to this client account.");
      siteId = system.site_id as string;
    }

    await db
      .prepare(
        `INSERT INTO maintenance_requests
           (id, site_id, system_id, requester_user_id, request_type, priority, status, subject, message)
         VALUES
           (?1, ?2, ?3, ?4, ?5, ?6, 'New', ?7, ?8)`
      )
      .bind(id, siteId, systemId, user.id, requestType, priority, subject, message)
      .run();

    await auditEvent(db, request, {
      eventType: "maintenance_request.create",
      entityType: "maintenance_request",
      entityId: id,
      outcome: "success",
      user,
      metadata: { siteId, systemId, requestType, priority }
    });

    return json({ ok: true, id, status: "New" });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return badRequest("Request body must be valid JSON.");
    if (error instanceof Error && error.message) return badRequest(error instanceof Error ? error.message : "Unknown error");
    await auditError(db, request, error as Error, { user, metadata: { message: "maintenance request failed" } });
    return serverError("Maintenance request could not be submitted.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}

