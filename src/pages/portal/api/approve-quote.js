import { getDatabase } from "../../../lib/server/bindings";
import { verifyCsrfToken } from "../../../lib/server/csrf";
import { FinanceService } from "../../../lib/server/services/finance-service";

export const prerender = false;

export async function POST({ request, locals }) {
  try {
    // Verify authentication
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
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
    const quoteId = formData.get('quoteId');
    const status = formData.get('status'); // 'approved' or 'rejected'

    if (!quoteId || !status) {
      return new Response(
        JSON.stringify({ error: "Quote ID and status are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = getDatabase();
    const financeService = new FinanceService(db);

    // Get the current financial record to determine site and amount
    const financialRecord = await db.prepare(
      `SELECT id, site_id, job_id, amount 
       FROM financial_records 
       WHERE id = ? AND item_type = 'Quote'`
    ).bind(quoteId).first();

    if (!financialRecord) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (status === 'approved') {
      // INSTEAD OF converting the quote to an invoice in financial_records,
      // create a finance task to track the approval and subsequent invoice creation in Sage
      await financeService.createFinanceTask({
        siteId: financialRecord.site_id,
        jobId: financialRecord.job_id,
        taskType: 'Quote Approved',
        amount: financialRecord.amount,
        status: 'Pending',
        notes: `Client approved quote ${quoteId}. Invoice needs to be issued in Sage.`
      });

      // Update the original quote record to reflect approval
      await db.prepare(
        `UPDATE financial_records 
         SET finance_task_status = 'Quote Approved',
             updated_at = datetime('now')
         WHERE id = ?`
      ).bind(quoteId).run();
    } else if (status === 'rejected') {
      // Update the original quote record to reflect rejection
      await db.prepare(
        `UPDATE financial_records 
         SET finance_task_status = 'Quote Rejected',
             updated_at = datetime('now')
         WHERE id = ?`
      ).bind(quoteId).run();
    }

    // Log the event
    await db.prepare(
      `INSERT INTO audit_events (user_id, event_type, event_details, ip_address, user_agent)
       VALUES (?1, 'Quote Status Updated', ?2, ?3, ?4)`
    ).bind(
      user.id,
      `Updated quote ${quoteId} status to ${status}`,
      request.headers.get('CF-Connecting-IP') || '',
      request.headers.get('User-Agent') || ''
    ).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Quote ${status}. A finance task has been created to track the next steps in Sage.`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Quote approval failed:", error);
    return new Response(
      JSON.stringify({ error: "Quote approval failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}