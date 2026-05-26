import { auditError } from "../../../../lib/server/audit.js";
/**
 * Project Sentinel - Finance Records API
 * Purpose: Handles creation of quotes and invoices manually in the portal
 * Dependencies: ../../../../lib/server/bindings.js, ../../../../lib/server/audit.js, ../../../../lib/server/http.js
 * Structural Role: REST API controller for ledger insertions
 */

import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.js";

export const prerender = false;

const ITEM_TYPES = new Set(["Quote", "Invoice"]);
const INITIAL_STATUS = { Quote: "Pending Approval", Invoice: "Unpaid" };

function cleanAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 9_999_999) {
    throw new Error("Amount must be a number between 0 and 9,999,999.");
  }
  return Math.round(num * 100);
}

function cleanDate(value, field) {
  const str = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) throw new Error(`${field} must be a date in YYYY-MM-DD format.`);
  return str;
}

function cleanOptionalId(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(str)) throw new Error("jobId format is invalid.");
  return str;
}

function cleanRef(value) {
  if (!value) return null;
  return String(value).trim().slice(0, 120) || null;
}

export async function POST({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) {
      return forbidden("Only finance or admin accounts can create financial records.");
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }

    const siteId = String(body.siteId || "").trim();
    if (!/^[A-Za-z0-9_-]{3,80}$/.test(siteId)) return badRequest("siteId is invalid.");

    const itemType = String(body.itemType || "").trim();
    if (!ITEM_TYPES.has(itemType)) return badRequest("itemType must be Quote or Invoice.");

    let amountExVat, vatAmount, amountIncVat, distributionDate, sageDocumentDate, sageDueDate;
    try {
      amountExVat = cleanAmount(body.amountExVat);
      vatAmount = body.vatAmount ? cleanAmount(body.vatAmount) : Math.round(amountExVat * 0.15);
      amountIncVat = body.amountIncVat ? cleanAmount(body.amountIncVat) : amountExVat + vatAmount;
      distributionDate = cleanDate(body.distributionDate, "distributionDate");
      sageDocumentDate = body.sageDocumentDate ? cleanDate(body.sageDocumentDate, "sageDocumentDate") : null;
      sageDueDate = body.sageDueDate ? cleanDate(body.sageDueDate, "sageDueDate") : null;
    } catch (error) {
      return badRequest(error.message);
    }

    let jobId, reference, financeNotes;
    try {
      jobId = cleanOptionalId(body.jobId);
      reference = cleanRef(body.reference);
      financeNotes = body.financeNotes ? String(body.financeNotes).trim().slice(0, 500) || null : null;
    } catch (error) {
      return badRequest(error.message);
    }

    const db = getDatabase();

    // Validate site exists
    const site = await db.prepare(`SELECT id FROM sites WHERE id = ?1 LIMIT 1`).bind(siteId).first();
    if (!site) return badRequest("The specified site was not found.");

    // Validate job if provided
    if (jobId) {
      const job = await db
        .prepare(
          `SELECT jobs.id, systems.site_id
           FROM jobs
           INNER JOIN systems ON systems.id = jobs.system_id
           WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
             AND jobs.id = ?1
           LIMIT 1`
        )
        .bind(jobId)
        .first();
      if (!job) return badRequest("The specified job was not found.");
      if (job.site_id !== siteId) return badRequest("The specified job does not belong to the selected site.");

      const existing = await db
        .prepare(
          `SELECT id
           FROM financial_records
           WHERE job_id = ?1 AND item_type = ?2
           LIMIT 1`
        )
        .bind(jobId, itemType)
        .first();
      if (existing) return badRequest(`This job already has a ${itemType.toLowerCase()} record.`);
    }

    const recordId = crypto.randomUUID();
    const paymentStatus = INITIAL_STATUS[itemType];
    const financeTaskStatus = itemType === "Quote" ? "Quote Required" : "Invoice Required";

    await db
      .prepare(
        `INSERT INTO financial_records
           (id, site_id, job_id, amount, sage_amount_ex_vat, sage_vat_amount, sage_amount_inc_vat,
            item_type, payment_status, distribution_date, sage_document_date, sage_due_date,
            reference, finance_notes, finance_task_status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
      )
      .bind(recordId, siteId, jobId, amountIncVat, amountExVat, vatAmount, amountIncVat,
            itemType, paymentStatus, distributionDate, sageDocumentDate, sageDueDate,
            reference, financeNotes, financeTaskStatus)
      .run();

    await auditEvent(db, request, {
      eventType: "finance.record.create",
      entityType: "financial_record",
      entityId: recordId,
      outcome: "success",
      user,
      metadata: { itemType, siteId, jobId, amountExVat, vatAmount, amountIncVat, paymentStatus, reference, financeTaskStatus, sageDocumentDate, sageDueDate }
    });

    return json({ ok: true, recordId, itemType, paymentStatus, financeTaskStatus, amountExVat, vatAmount, amountIncVat, distributionDate });
  } catch (error) {
    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "finance record creation failed" } });
    return serverError("The financial record could not be created.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
