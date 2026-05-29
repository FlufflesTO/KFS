import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.ts";
import type { APIContext } from "astro";

export const prerender = false;

const VALID_TASK_STATUSES = [
  "Finance Review Required",
  "Quote Required",
  "Sage Quote Created",
  "Sage Quote Sent",
  "Awaiting Client Approval",
  "Quote Approved",
  "Approved - Sage Invoice Required",
  "Invoice Required",
  "Sage Invoice Created",
  "Sage Invoice Sent",
  "Payment Pending in Sage",
  "Paid in Sage",
  "Sage Reference Missing",
  "Awaiting Payment",
  "Complete",
  "On Hold",
  "Cancelled",
  "No Charge",
  "Closed"
];

/**
 * POST /portal/api/finance/sage-reference
 * Finance / admin only.
 * Accepts: { recordId, sageInvoiceNumber?, sageQuoteNumber?, sageCustomerCode?, financeTaskStatus? }
 * Saves Sage manual reference fields to financial_records and audit logs the change.
 */
export async function POST({ request, locals }: APIContext) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) {
      return forbidden("Only finance or admin accounts can update Sage references.");
    }

    const body = await request.json();

    const recordId          = String(body.recordId          || "").trim();
    const sageInvoiceNumber = String(body.sageInvoiceNumber  || "").trim().slice(0, 60) || null;
    const sageQuoteNumber   = String(body.sageQuoteNumber    || "").trim().slice(0, 60) || null;
    const sageCustomerCode  = String(body.sageCustomerCode   || "").trim().slice(0, 40) || null;
    const financeTaskStatus = String(body.financeTaskStatus  || "").trim() || null;
    const sageAmountExVat   = body.sageAmountExVat   != null ? Math.round(Number(body.sageAmountExVat) * 100) : null;
    const sageVatAmount     = body.sageVatAmount     != null ? Math.round(Number(body.sageVatAmount) * 100) : null;
    const sageAmountIncVat  = body.sageAmountIncVat  != null ? Math.round(Number(body.sageAmountIncVat) * 100) : null;
    const sageDocumentDate  = String(body.sageDocumentDate || "").trim().slice(0, 10) || null;
    const sageDueDate       = String(body.sageDueDate       || "").trim().slice(0, 10) || null;
    const financeNotes      = String(body.financeNotes      || "").trim().slice(0, 500) || null;

    if (!/^[A-Za-z0-9_-]{3,80}$/.test(recordId)) {
      return badRequest("recordId is invalid.");
    }
    if (financeTaskStatus && !VALID_TASK_STATUSES.includes(financeTaskStatus)) {
      return badRequest("financeTaskStatus is not a recognised value.");
    }

    const db = getDatabase();
    const record = await db
      .prepare(`SELECT id, item_type FROM financial_records WHERE id = ?1 LIMIT 1`)
      .bind(recordId)
      .first();

    if (!record) return badRequest("Finance record was not found.");

    let newItemType = record.item_type;
    let newPaymentStatus = undefined; // Undefined means don't change

    if (record.item_type === "Task") {
      if (sageInvoiceNumber) {
        newItemType = "Invoice";
        newPaymentStatus = "Unpaid";
      } else if (sageQuoteNumber) {
        newItemType = "Quote";
        newPaymentStatus = "Pending Approval";
      }
    }

    await db
      .prepare(
        `UPDATE financial_records
         SET sage_invoice_number   = ?2,
             sage_quote_number     = ?3,
             sage_customer_code    = ?4,
             finance_task_status   = ?5,
             sage_amount_ex_vat    = COALESCE(?6,  sage_amount_ex_vat),
             sage_vat_amount       = COALESCE(?7,  sage_vat_amount),
             sage_amount_inc_vat   = COALESCE(?8,  sage_amount_inc_vat),
             sage_document_date    = COALESCE(?9,  sage_document_date),
             sage_due_date         = COALESCE(?10, sage_due_date),
             finance_notes         = COALESCE(?11, finance_notes),
             item_type             = COALESCE(?12, item_type),
             payment_status        = COALESCE(?13, payment_status),
             updated_at            = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?1`
      )
      .bind(recordId, sageInvoiceNumber, sageQuoteNumber, sageCustomerCode, financeTaskStatus,
            sageAmountExVat, sageVatAmount, sageAmountIncVat, sageDocumentDate, sageDueDate, financeNotes,
            newItemType, newPaymentStatus)
      .run();

    await auditEvent(db, request, {
      eventType:  "finance.sage_reference",
      entityType: "financial_record",
      entityId:   recordId,
      outcome:    "success",
      user,
      metadata: {
        itemType:           newItemType,
        sageInvoiceNumber,
        sageQuoteNumber,
        sageCustomerCode,
        financeTaskStatus,
        sageAmountExVat,
        sageVatAmount,
        sageAmountIncVat,
        sageDocumentDate,
        sageDueDate,
        financeNotes
      }
    });

    return json({ ok: true, recordId });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }
    await auditError(typeof db !== 'undefined' ? db : getDatabase(), request, error, { user: typeof user !== 'undefined' ? user : null, metadata: { message: "sage reference update failed" } });
    return serverError("Sage reference update could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
