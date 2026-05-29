import { getBindings } from "../../../lib/server/bindings";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const { env, db } = getBindings();
    
    // Verify webhook source using a shared secret from environment
    const authHeader = request.headers.get("Authorization");
    const webhookSecret = String(env.SAGE_WEBHOOK_SECRET || "");
    
    if (!webhookSecret) {
      console.warn("SAGE_WEBHOOK_SECRET is not configured. Webhook security is degraded.");
    }

    if (!authHeader || (webhookSecret && authHeader !== `Bearer ${webhookSecret}`)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Verify this is from Sage
    const contentType = request.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const payload = await request.json();
    
    // Validate webhook payload
    if (!payload.event || !payload.data) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
    );
    }
    
    // Process different Sage events
    switch (payload.event) {
      case 'payment_received':
        await handlePaymentReceived(db, payload.data);
        break;
      case 'invoice_paid':
        await handleInvoicePaid(db, payload.data);
        break;
      case 'quote_approved':
        await handleQuoteApproved(db, payload.data);
        break;
      default:
        console.log(`Unhandled Sage event: ${payload.event}`);
        break;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sage webhook processing failed:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handlePaymentReceived(db: any, data: any) {
  // Update financial records with Sage payment reference
  if (data.invoice_number && data.payment_reference) {
    await db.prepare(
      `UPDATE financial_records 
       SET sage_payment_reference = ?1, 
           payment_status = 'Settled',
           finance_task_status = 'Paid in Sage',
           updated_at = datetime('now')
       WHERE sage_invoice_number = ?2`
    ).bind(data.payment_reference, data.invoice_number).run();
  }
}

async function handleInvoicePaid(db: any, data: any) {
  // Update invoice status when paid in Sage
  if (data.invoice_number) {
    await db.prepare(
      `UPDATE financial_records 
       SET payment_status = 'Settled',
           finance_task_status = 'Paid in Sage',
           sage_document_date = ?1,
           updated_at = datetime('now')
       WHERE sage_invoice_number = ?2`
    ).bind(data.document_date, data.invoice_number).run();
  }
}

async function handleQuoteApproved(db: any, data: any) {
  // Update quote status when approved in Sage
  if (data.quote_number) {
    await db.prepare(
      `UPDATE financial_records 
       SET finance_task_status = 'Quote Approved',
           sage_document_date = ?1,
           updated_at = datetime('now')
       WHERE sage_quote_number = ?2`
    ).bind(data.document_date, data.quote_number).run();
  }
}
