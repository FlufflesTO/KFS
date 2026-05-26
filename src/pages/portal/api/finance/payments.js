import { getDatabase } from "../../../../lib/server/bindings";
import { auditEvent } from "../../../../lib/server/audit.js";
import { requireAdminOrFinance } from "../../../../lib/server/finance.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { FinanceService } from "../../../../lib/server/services/finance-service";

// Implementation marker: finance.payment

export const prerender = false;

export async function POST({ request, locals }) {
  try {
    const user = locals.user;
    const authError = requireAdminOrFinance(user);
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const financialRecordId = String(body.recordId || body.financialRecordId || "").trim();
    const sagePaymentRef = String(body.paymentReference || body.sagePaymentRef || "").trim();

    if (!financialRecordId || !sagePaymentRef) {
      return badRequest("Financial record ID and Sage payment reference are required.");
    }

    const db = getDatabase();
    const financeService = new FinanceService(db);

    // Get the financial record to determine site and amount
    const financialRecord = await db.prepare(
      `SELECT id, site_id, job_id, amount, item_type
       FROM financial_records 
       WHERE id = ?`
    ).bind(financialRecordId).first();

    if (!financialRecord) {
      return badRequest("Financial record not found.");
    }

    // INSTEAD OF marking the record as 'Settled' in the portal,
    // create a finance task to track that payment was recorded in Sage
    await financeService.createFinanceTask({
      siteId: financialRecord.site_id,
      jobId: financialRecord.job_id,
      taskType: 'Payment Recorded in Sage',
      amount: financialRecord.amount,
      status: 'Completed',
      sageDocumentRef: sagePaymentRef,
      notes: `Payment recorded in Sage with reference: ${sagePaymentRef}`
    });

    // Update the original financial record to reflect Sage payment reference
    await db.prepare(
      `UPDATE financial_records 
       SET sage_payment_reference = ?1,
           finance_task_status = 'Paid in Sage',
           updated_at = datetime('now')
       WHERE id = ?2`
    ).bind(sagePaymentRef, financialRecordId).run();

    await auditEvent(db, request, {
      eventType: "finance.payment",
      entityType: "financial_record",
      entityId: financialRecordId,
      outcome: "success",
      user,
      metadata: { sagePaymentRef }
    });

    return json({ 
      ok: true,
      success: true,
      paymentReference: sagePaymentRef,
      message: `Payment recorded in Sage with reference ${sagePaymentRef}. Finance task updated accordingly.`
    });
  } catch (error) {
    console.error("Payment processing failed:", error);
    if (error instanceof SyntaxError) return badRequest("Request body must be valid JSON.");
    return serverError("Payment processing failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
