import type { APIRoute } from "astro";
import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http";
import { cleanChoice, cleanDate, cleanId, cleanInt, cleanText, readJson, requireAdmin } from "../../../../lib/server/access";
import { SystemRepository } from "../../../../lib/server/db/system-repository";

export const prerender = false;

const systemTypes = ["Gas Suppression", "Fire Detection"];

export const POST: APIRoute = async ({ request, locals }) => {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  let db: ReturnType<typeof getDatabase>;
  try {
    db = getDatabase();
    const systemRepository = new SystemRepository(db);

    const body = await readJson(request) as Record<string, any>;
    const action = String(body.action || "create");
    const id = action === "create" ? crypto.randomUUID() : cleanId(body.id, "id");
    if (!id) return badRequest("id is required.");
    const siteId = cleanId(body.siteId, "siteId");
    if (!siteId) return badRequest("siteId is required.");
    const systemType = cleanChoice(body.systemType, "systemType", systemTypes);
    const coverageArea = cleanText(body.coverageArea, "coverageArea", { min: 2, max: 200 });
    const manufacturer = cleanText(body.manufacturer, "manufacturer", { required: false, max: 120 });
    const modelReference = cleanText(body.modelReference, "modelReference", { required: false, max: 120 });
    const nextDueDate = cleanDate(body.nextDueDate, "nextDueDate");
    const serviceIntervalMonths = cleanInt(body.serviceIntervalMonths, "serviceIntervalMonths", { min: 1, max: 36, fallback: 6 });

    if (action === "create") {
      await systemRepository.create({
        id,
        site_id: siteId,
        system_type: systemType,
        coverage_area: coverageArea,
        manufacturer: manufacturer,
        model_reference: modelReference,
        next_due_date: nextDueDate,
        service_interval_months: serviceIntervalMonths,
        system_subtype: null,
        serial_number: null,
        installation_date: null,
        last_service_date: null,
        notes: null
      });
    } else if (action === "update") {
      // Verify system exists before updating
      const existing = await systemRepository.findById(id);
      if (!existing) {
        return badRequest("System not found.");
      }

      await systemRepository.update(id, {
        site_id: siteId,
        system_type: systemType,
        coverage_area: coverageArea,
        manufacturer: manufacturer,
        model_reference: modelReference,
        next_due_date: nextDueDate,
        service_interval_months: serviceIntervalMonths
      });
    } else if (action === "delete") {
      // Soft delete using repository
      const existing = await systemRepository.findById(id);
      if (!existing) {
        return badRequest("System not found.");
      }

      await systemRepository.softDelete(id);
    } else {
      return badRequest("action is invalid.");
    }

    await auditEvent(db, request, {
      eventType: `admin.system.${action}`,
      entityType: "system",
      entityId: id,
      outcome: "success",
      user: locals.user,
      metadata: { siteId, systemType }
    });

    return json({ ok: true, id });
  } catch (error) {
    if (error instanceof Error && error.message) return badRequest(error.message);
    await auditError(db!, request, error as Error, { user: locals.user || undefined, metadata: { message: "admin systems failed" } });
    return serverError("System administration failed.");
  }
};

export const ALL: APIRoute = () => {
  return methodNotAllowed(["POST"]);
};
