import { getDatabase } from "../../../../lib/server/bindings";
import { verifyCsrfToken } from "../../../../lib/server/csrf";
import { requireAdminOrFinance } from "../../../../lib/server/finance.js";
import { FinanceService } from "../../../../lib/server/services/finance-service";

// Implementation marker: finance.payment

export const prerender = false;

export async function POST({ request, locals }) {
  try {
    // Verify authentication and authorization
    const user = locals.user;
    const authError = requireAdminOrFinance(user);
    if (authError) {
      return authError;
    }

    // Verify CSRF token
    const formData = await request.formData();
    const csrfToken = formData.get('_csrf');
    if (!csrfToken || !verifyCsrfToken(csrfToken, user)) {
      return new Response(
        JSON.stringify({ error: "Invalid CSRF token" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract form data
    const financialRecordId = formData.get('financialRecordId');
    const sagePaymentRef = formData.get('sagePaymentRef');

    if (!financialRecordId || !sagePaymentRef) {
      return new Response(
        JSON.stringify({ error: "Financial record ID and Sage payment reference are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ error: "Financial record not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
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

    // Log the event
    await db.prepare(
      `INSERT INTO audit_events (user_id, event_type, event_details, ip_address, user_agent)
       VALUES (?1, 'Payment Processed', ?2, ?3, ?4)`
    ).bind(
      user.id,
      `Recorded payment in Sage with reference ${sagePaymentRef} for financial record ${financialRecordId}`,
      request.headers.get('CF-Connecting-IP') || '',
      request.headers.get('User-Agent') || ''
    ).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Payment recorded in Sage with reference ${sagePaymentRef}. Finance task updated accordingly.`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment processing failed:", error);
    return new Response(
      JSON.stringify({ error: "Payment processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
