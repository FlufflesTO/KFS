
import { getDatabase } from "../../../lib/server/bindings";
import { auditEvent } from "../../../lib/server/audit";
import { clientCanAccessSite } from "../../../lib/server/access";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.ts";
import { FinanceService } from "../../../lib/server/services/finance-service";
import { QuoteApprovalSchema } from "../../../lib/validation/schemas";

export const prerender = false;

export async function POST({ request, locals }: import('astro').APIContext) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (user.role !== "client" && user.role !== "admin") return forbidden("Only client or admin accounts can approve quotes.");

    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    const parsed = QuoteApprovalSchema.safeParse({
      quoteId: body.recordId || body.quoteId,
      status: body.status
    });

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed.");
    }

    const { quoteId, status } = parsed.data;

    const db = getDatabase();
    const financeService = new FinanceService(db);

    // Get the current financial record to determine site and amount
    const financialRecord = await db.prepare(
      `SELECT id, site_id, job_id, amount 
       FROM financial_records 
       WHERE id = ? AND item_type = 'Quote'`
    ).bind(quoteId).first();

    if (!financialRecord) {
      return badRequest("Quote not found.");
    }

    // Security: Check if client has access to this site
    if (user.role === "client" && !(await clientCanAccessSite(db, user, String(financialRecord.site_id)))) {
      return forbidden("You do not have access to approve quotes for this site.");
    }

    if (status === 'approved') {
      // INSTEAD OF converting the quote to an invoice in financial_records,
      // create a finance task to track the approval and subsequent invoice creation in Sage
      await financeService.createFinanceTask({
        siteId: String(financialRecord.site_id),
        jobId: financialRecord.job_id ? String(financialRecord.job_id) : undefined,
        taskType: 'Quote Approved',
        amount: Number(financialRecord.amount),
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

    await auditEvent(db, request, {
      eventType: "finance.quote_status",
      entityType: "financial_record",
      entityId: quoteId,
      outcome: "success",
      user,
      metadata: { status }
    });

    return json({ 
      ok: true,
      success: true, 
      message: `Quote ${status}. A finance task has been created to track the next steps in Sage.`
    });
  } catch (error: unknown) {
    console.error("Quote approval failed:", error);
    if (error instanceof SyntaxError) return badRequest("Request body must be valid JSON.");
    return serverError("Quote approval failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}

