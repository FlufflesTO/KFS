import { auditError } from "../../../../lib/server/audit.js";
import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.js";

export const prerender = false;

function paymentReference(recordId) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = String(recordId).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
  return `PAY-${date}-${suffix}`;
}

export async function POST({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) return forbidden("Only finance or admin accounts can capture payments.");

    const body = await request.json();
    const recordId = String(body.recordId || "").trim();
    const paymentNote = String(body.paymentReference || "").trim().slice(0, 80);

    if (!/^[A-Za-z0-9_-]{3,80}$/.test(recordId)) {
      return badRequest("recordId is invalid.");
    }

    const db = getDatabase();
    const invoice = await db
      .prepare(
        `SELECT id, site_id, job_id, amount, item_type, payment_status, reference
         FROM financial_records
         WHERE id = ?1
         LIMIT 1`
      )
      .bind(recordId)
      .first();

    if (!invoice) {
      await auditEvent(db, request, {
        eventType: "finance.payment",
        entityType: "financial_record",
        entityId: recordId,
        outcome: "failure",
        user,
        metadata: { reason: "invoice_not_found" }
      });
      return badRequest("Invoice record was not found.");
    }

    if (invoice.item_type !== "Invoice" || invoice.payment_status !== "Unpaid") {
      await auditEvent(db, request, {
        eventType: "finance.payment",
        entityType: "financial_record",
        entityId: recordId,
        outcome: "failure",
        user,
        metadata: { reason: "invalid_state", itemType: invoice.item_type, paymentStatus: invoice.payment_status }
      });
      return badRequest("Only unpaid invoice records can have a Sage payment recorded.");
    }

    const paymentRef = paymentNote || paymentReference(recordId);

    await db.prepare(
      `UPDATE financial_records
       SET payment_status = 'Settled',
           sage_payment_reference = ?2,
           finance_task_status = 'Paid in Sage'
       WHERE id = ?1`
    ).bind(recordId, paymentRef).run();

    await auditEvent(db, request, {
      eventType: "finance.payment",
      entityType: "financial_record",
      entityId: recordId,
      outcome: "success",
      user,
      metadata: { paymentReference: paymentRef, invoiceReference: invoice.reference || null }
    });

    return json({ ok: true, recordId, paymentStatus: "Settled", paymentReference: paymentRef });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "payment capture failed" } });
    return serverError("Payment capture could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
