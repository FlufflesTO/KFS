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
  return +num.toFixed(2);
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

function cleanOptionalText(value, maxLength = 120) {
  if (!value) return null;
  const str = String(value).trim();
  return str.length > 0 ? str.slice(0, maxLength) : null;
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

    let amount, distributionDate;
    try {
      amount = cleanAmount(body.amount);
      distributionDate = cleanDate(body.distributionDate, "distributionDate");
    } catch (error) {
      return badRequest(error.message);
    }

    let jobId, reference;
    try {
      jobId = cleanOptionalId(body.jobId);
      reference = cleanRef(body.reference);
    } catch (error) {
      return badRequest(error.message);
    }

    // Sage integration fields (Phase 21)
    const sageReference = cleanOptionalText(body.sageReference, 120);
    const sageInvoiceNumber = cleanOptionalText(body.sageInvoiceNumber, 80);
    const sageQuoteNumber = cleanOptionalText(body.sageQuoteNumber, 80);
    const financeNotes = cleanOptionalText(body.financeNotes, 500);
    const requiresSageSync = body.requiresSageSync === true ? 1 : 0;
    const sageSyncStatus = body.sageSyncStatus || "Pending";
    if (!["Pending", "Synced", "Error", "Manual Override"].includes(sageSyncStatus)) {
      return badRequest("sageSyncStatus must be one of: Pending, Synced, Error, Manual Override");
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
           WHERE jobs.id = ?1
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

    await db
      .prepare(
        `INSERT INTO financial_records
           (id, site_id, job_id, amount, item_type, payment_status, distribution_date, reference,
            sage_reference, sage_invoice_number, sage_quote_number, requires_sage_sync, sage_sync_status, finance_notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`
      )
      .bind(recordId, siteId, jobId, amount, itemType, paymentStatus, distributionDate, reference,
            sageReference, sageInvoiceNumber, sageQuoteNumber, requiresSageSync, sageSyncStatus, financeNotes)
      .run();

    await auditEvent(db, request, {
      eventType: "finance.record.create",
      entityType: "financial_record",
      entityId: recordId,
      outcome: "success",
      user,
      metadata: { itemType, siteId, jobId, amount, paymentStatus, reference, sageReference, sageInvoiceNumber, requiresSageSync }
    });

    return json({ ok: true, recordId, itemType, paymentStatus, amount, distributionDate, sageReference, sageInvoiceNumber, requiresSageSync });
  } catch (error) {
    console.error("finance record creation failed", error);
    return serverError("The financial record could not be created.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
