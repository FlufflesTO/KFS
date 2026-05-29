// @ts-nocheck
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent, auditError } from "../../../../lib/server/audit";
import { badRequest, forbidden, json, unauthorized } from "../../../../lib/server/http.ts";
import { FinanceService } from "../../../../lib/server/services/finance-service.ts";

export const prerender = false;

const ITEM_TYPES = new Set(["Task", "Quote", "Invoice"]);

function cleanAmount(value: any) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 9_999_999) {
    throw new Error("Amount must be a number between 0 and 9,999,999.");
  }
  return Math.round(num * 100);
}

function cleanOptionalId(value: any) {
  if (!value) return null;
  const str = String(value).trim();
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(str)) throw new Error("jobId format is invalid.");
  return str;
}

function cleanRef(value: any) {
  if (!value) return null;
  return String(value).trim().slice(0, 120) || null;
}

export async function POST({ request, locals }: import('astro').APIContext) {
  const db = getDatabase();
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) {
      return forbidden("Only finance or admin accounts can create financial records.");
    }

    let body = {};
    try {
      body = await request.json() as any;
    } catch {
      return badRequest("Request body must be valid JSON.");
    }

    const siteId = String(body.siteId || "").trim();
    if (!/^[A-Za-z0-9_-]{3,80}$/.test(siteId)) return badRequest("siteId is invalid.");

    const itemType = String(body.itemType || "").trim();
    if (!ITEM_TYPES.has(itemType)) return badRequest("itemType must be Task, Quote, or Invoice.");

    let amountExVat, vatAmount;
    try {
      amountExVat = cleanAmount(body.amountExVat);
      vatAmount = body.vatAmount ? cleanAmount(body.vatAmount) : Math.round(amountExVat * 0.15);
    } catch (error: any) {
      return badRequest(error.message);
    }

    let jobId, reference, financeNotes;
    try {
      jobId = cleanOptionalId(body.jobId);
      reference = cleanRef(body.reference);
      financeNotes = body.financeNotes ? String(body.financeNotes).trim().slice(0, 500) || null : null;
    } catch (error: any) {
      return badRequest(error.message);
    }

    // Validate site exists
    const site = await db.prepare(`SELECT id FROM sites WHERE id = ?1 LIMIT 1`).bind(siteId).first();
    if (!site) return badRequest("The specified site was not found.");

    const financeService = new FinanceService(db);
    
    // Map itemType to taskType
    let taskType = "Finance Follow-up";
    if (itemType === "Quote") taskType = "Quote Required";
    if (itemType === "Invoice") taskType = "Invoice Required";

    const task = await financeService.createFinanceTask({
      siteId,
      jobId,
      taskType: taskType,
      amount: amountExVat,
      vatAmount,
      reference,
      status: "Pending",
      notes: financeNotes
    });

    await auditEvent(db, request, {
      userId: user.id,
      eventType: "finance_task_created",
      resourceType: "finance_task",
      resourceId: task.id,
      siteId: siteId,
      jobId: jobId,
      details: { amountExVat, itemType },
      status: "success",
    });

    return json({ ok: true, message: "Record created successfully.", task });
  } catch (error: any) {
    await auditError(db, request, error, {
      user: locals.user,
      metadata: { message: "Error creating finance task" },
    });
    return json({ ok: false, message: "An internal error occurred." }, { status: 500 });
  }
}

