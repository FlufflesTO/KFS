import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanChoice, cleanDate, cleanId, cleanInt, cleanText, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

const systemTypes = ["Gas Suppression", "Fire Detection"];

export async function POST({ request, locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const action = String(body.action || "create");
    const id = action === "create" ? crypto.randomUUID() : cleanId(body.id, "id");
    const siteId = cleanId(body.siteId, "siteId");
    const systemType = cleanChoice(body.systemType, "systemType", systemTypes);
    const coverageArea = cleanText(body.coverageArea, "coverageArea", { min: 2, max: 200 });
    const manufacturer = cleanText(body.manufacturer, "manufacturer", { required: false, max: 120 });
    const modelReference = cleanText(body.modelReference, "modelReference", { required: false, max: 120 });
    const nextDueDate = cleanDate(body.nextDueDate, "nextDueDate");
    const serviceIntervalMonths = cleanInt(body.serviceIntervalMonths, "serviceIntervalMonths", { min: 1, max: 36, fallback: 6 });

    if (action === "create") {
      await db
        .prepare(
          `INSERT INTO systems
             (id, site_id, system_type, coverage_area, manufacturer, model_reference, next_due_date, service_interval_months)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        )
        .bind(id, siteId, systemType, coverageArea, manufacturer, modelReference, nextDueDate, serviceIntervalMonths)
        .run();
    } else if (action === "update") {
      await db
        .prepare(
          `UPDATE systems
           SET site_id = ?1,
               system_type = ?2,
               coverage_area = ?3,
               manufacturer = ?4,
               model_reference = ?5,
               next_due_date = ?6,
               service_interval_months = ?7
           WHERE id = ?8 AND deleted_at IS NULL`
        )
        .bind(siteId, systemType, coverageArea, manufacturer, modelReference, nextDueDate, serviceIntervalMonths, id)
        .run();
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
    if (error.message) return badRequest(error.message);
    console.error("admin systems failed", error);
    return serverError("System administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
