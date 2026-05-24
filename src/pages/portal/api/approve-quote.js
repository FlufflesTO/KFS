import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { clientCanAccessSite } from "../../../lib/server/clientAccess.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

function invoiceReference(recordId) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = String(recordId).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
  return `INV-${date}-${suffix}`;
}

export async function POST({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (user.role !== "client") return forbidden("Only client accounts can approve quotes.");

    const body = await request.json();
    const recordId = String(body.recordId || "").trim();
    if (!/^[A-Za-z0-9_-]{3,80}$/.test(recordId)) {
      return badRequest("recordId is invalid.");
    }

    const db = getDatabase();
    const record = await db
      .prepare(
        `SELECT id, site_id, item_type, payment_status, reference
         FROM financial_records
         WHERE id = ?1
         LIMIT 1`
      )
      .bind(recordId)
      .first();

    if (!record || !(await clientCanAccessSite(db, user, record.site_id))) {
      await auditEvent(db, request, {
        eventType: "quote.approve",
        entityType: "financial_record",
        entityId: recordId,
        outcome: "blocked",
        user,
        metadata: { reason: "not_found_or_wrong_site" }
      });
      return forbidden("Quote approval is not permitted for this account.");
    }

    if (record.item_type !== "Quote" || record.payment_status !== "Pending Approval") {
      await auditEvent(db, request, {
        eventType: "quote.approve",
        entityType: "financial_record",
        entityId: recordId,
        outcome: "failure",
        user,
        metadata: {
          reason: "invalid_state",
          itemType: record.item_type,
          paymentStatus: record.payment_status
        }
      });
      return badRequest("Only pending quote records can be approved.");
    }

    await db
      .prepare(
        `UPDATE financial_records
         SET item_type = 'Invoice',
             payment_status = 'Unpaid',
             distribution_date = date('now'),
             reference = COALESCE(reference, ?2)
         WHERE id = ?1`
      )
      .bind(recordId, invoiceReference(recordId))
      .run();

    await auditEvent(db, request, {
      eventType: "quote.approve",
      entityType: "financial_record",
      entityId: recordId,
      outcome: "success",
      user,
      metadata: { siteId: record.site_id }
    });

    return json({ ok: true, recordId, itemType: "Invoice", paymentStatus: "Unpaid" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    console.error("quote approval failed", error);
    return serverError("Quote approval could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
