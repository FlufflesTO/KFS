
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent, auditError } from "../../../../lib/server/audit";
import { badRequest, forbidden, json, unauthorized } from "../../../../lib/server/http.ts";
import { FinanceService } from "../../../../lib/server/services/finance-service.ts";
import { FinanceTaskCreateSchema } from "../../../../lib/validation/schemas.ts";

export const prerender = false;

const ITEM_TYPES = new Set(["Task", "Quote", "Invoice"]);

export async function POST({ request, locals }: import('astro').APIContext) {
  const db = getDatabase();
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) {
      return forbidden("Only finance or admin accounts can create financial records.");
    }

    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return badRequest("Request body must be valid JSON.");
    }

    // Map itemType to taskType for validation
    const itemType = String(body.itemType || "").trim();
    if (!ITEM_TYPES.has(itemType)) return badRequest("itemType must be Task, Quote, or Invoice.");

    let taskType: 'Quote Required' | 'Quote Issued in Sage' | 'Quote Approved' | 'Invoice Required' | 'Invoice Issued in Sage' | 'Payment Recorded in Sage' | 'Finance Follow-up' = "Finance Follow-up";
    if (itemType === "Quote") taskType = "Quote Required";
    if (itemType === "Invoice") taskType = "Invoice Required";

    // Convert amount from Rands to cents for schema validation
    const payload = {
      siteId: String(body.siteId || "").trim(),
      jobId: body.jobId ? String(body.jobId).trim() : null,
      taskType,
      amountExVat: Math.round(Number(body.amountExVat || 0) * 100), // Convert to cents
      vatAmount: body.vatAmount ? Math.round(Number(body.vatAmount) * 100) : Math.round(Number(body.amountExVat || 0) * 100 * 0.15),
      reference: body.reference ? String(body.reference).trim().slice(0, 120) : null,
      financeNotes: body.financeNotes ? String(body.financeNotes).trim().slice(0, 500) : null
    };

    // Validate payload against strict VAT schema
    const validation = FinanceTaskCreateSchema.safeParse(payload);
    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join("."),
        message: e.message
      }));
      return badRequest(JSON.stringify({ errors }));
    }

    const { siteId, jobId, amountExVat, vatAmount, reference, financeNotes } = validation.data;

    // Validate site exists
    const site = await db.prepare(`SELECT id FROM sites WHERE id = ?1 LIMIT 1`).bind(siteId).first();
    if (!site) return badRequest("The specified site was not found.");

    const financeService = new FinanceService(db);

    const task = await financeService.createFinanceTask({
      siteId,
      jobId: jobId ?? undefined,
      taskType,
      amount: amountExVat,
      vatAmount: vatAmount ?? undefined,
      reference: reference ?? undefined,
      status: "Pending",
      notes: financeNotes ?? undefined
    });

    await auditEvent(db, request, {
      eventType: "finance_task_created",
      entityType: "finance_task",
      entityId: task.id,
      outcome: "success",
      user,
      metadata: { siteId, jobId, amountExVat, itemType }
    });

    return json({ ok: true, message: "Record created successfully.", task });
  } catch (error: unknown) {
    await auditError(db, request, error as Error, {
      user: locals.user,
      metadata: { message: "Error creating finance task" },
    });
    return json({ ok: false, message: "An internal error occurred." }, { status: 500 });
  }
}

