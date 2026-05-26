import { auditError } from "../../../lib/server/audit.js";
import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { clientCanAccessSite } from "../../../lib/server/clientAccess.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

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
        `SELECT id, site_id, item_type, payment_status, finance_task_status
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

    if (
      record.item_type !== "Quote" ||
      record.payment_status !== "Pending Approval" ||
      record.finance_task_status === "Approved - Sage Invoice Required"
    ) {
      await auditEvent(db, request, {
        eventType: "quote.approve",
        entityType: "financial_record",
        entityId: recordId,
        outcome: "failure",
        user,
        metadata: {
          reason: "invalid_state",
          itemType: record.item_type,
          paymentStatus: record.payment_status,
          financeTaskStatus: record.finance_task_status
        }
      });
      return badRequest("Only pending quote records can be approved.");
    }

    await db
      .prepare(
        `UPDATE financial_records
         SET finance_task_status = 'Approved - Sage Invoice Required',
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?1`
      )
      .bind(recordId)
      .run();

    await auditEvent(db, request, {
      eventType: "quote.approve",
      entityType: "financial_record",
      entityId: recordId,
      outcome: "success",
      user,
      metadata: { siteId: record.site_id, financeTaskStatus: "Approved - Sage Invoice Required" }
    });

    return json({
      ok: true,
      recordId,
      itemType: "Quote",
      paymentStatus: record.payment_status,
      financeTaskStatus: "Approved - Sage Invoice Required"
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "quote approval failed" } });
    return serverError("Quote approval could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
