
import { auditError } from "../../../../lib/server/audit";
/**
 * Project Sentinel - Credit Note API
 * Purpose: Creates non-destructive credit notes linked to original finance records
 * Dependencies: ../../../../lib/server/bindings.ts, ../../../../lib/server/audit, ../../../../lib/server/http.ts
 * Structural Role: REST API controller for credit note/reversal workflow
 */

import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.ts";

export const prerender = false;

/**
 * POST /portal/api/finance/credit-note
 * Finance / admin only.
 * Accepts: { originalRecordId, reason, amountExVat?, vatAmount?, amountIncVat? }
 * Creates a negative financial_record linked via credit_note_for_id.
 */
export async function POST({ request, locals }: import('astro').APIContext) {
  const user = locals.user;
  const db = getDatabase();
  try {
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) {
      return forbidden("Only finance or admin accounts can create credit notes.");
    }

    let body: {
      originalRecordId?: string;
      reason?: string;
      amountExVat?: number;
      vatAmount?: number;
      amountIncVat?: number;
    } = {};
    try {
      body = await request.json() as typeof body;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const originalRecordId = String(body.originalRecordId || "").trim();
    if (!/^[A-Za-z0-9_-]{3,80}$/.test(originalRecordId)) {
      return badRequest("originalRecordId is invalid.");
    }

    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!reason) return badRequest("A reason for the credit note is required.");

    interface OriginalRecordRow {
      id: string;
      site_id: string;
      job_id: string | null;
      amount: number;
      item_type: string;
      payment_status: string;
      sage_amount_ex_vat: number | null;
      sage_vat_amount: number | null;
      sage_amount_inc_vat: number | null;
      sage_invoice_number: string | null;
      sage_quote_number: string | null;
    }

    const original = await db
      .prepare(
        `SELECT id, site_id, job_id, amount, item_type, payment_status,
                sage_amount_ex_vat, sage_vat_amount, sage_amount_inc_vat,
                sage_invoice_number, sage_quote_number
         FROM financial_records
         WHERE id = ?1 AND item_type IN ('Invoice', 'Quote')
         LIMIT 1`
      )
      .bind(originalRecordId)
      .first<OriginalRecordRow>();

    if (!original) return badRequest("The original record was not found or is not an Invoice/Quote.");
    if (original.payment_status === "Settled" && !original.sage_invoice_number) {
      return badRequest("This invoice is marked as Settled in Sage. Create the credit note in Sage first, then record it here.");
    }

    const creditNoteId = crypto.randomUUID();
    const amountExVat = body.amountExVat != null ? -Math.abs(Number(body.amountExVat)) : -(original.sage_amount_ex_vat ?? original.amount);
    const vatAmount = body.vatAmount != null ? -Math.abs(Number(body.vatAmount)) : -(original.sage_vat_amount ?? 0);
    const amountIncVat = body.amountIncVat != null ? -Math.abs(Number(body.amountIncVat)) : (amountExVat + vatAmount);

    await db.batch([
      db.prepare(
        `INSERT INTO financial_records
           (id, site_id, job_id, amount, sage_amount_ex_vat, sage_vat_amount, sage_amount_inc_vat,
            item_type, item_subtype, payment_status, distribution_date, finance_notes,
            finance_task_status, credit_note_for_id, reference)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
      ).bind(
        creditNoteId,
        original.site_id,
        original.job_id,
        amountIncVat,
        amountExVat,
        vatAmount,
        amountIncVat,
        original.item_type,
        "Credit Note",
        original.payment_status === "Settled" ? "Settled" : "Pending Approval",
        new Date().toISOString().slice(0, 10),
        `Credit note: ${reason}`,
        "Finance Review Required",
        originalRecordId,
        `CN for ${original.sage_invoice_number || original.sage_quote_number || originalRecordId}`
      ),
      db.prepare(
        `UPDATE financial_records
         SET finance_task_status = 'Credit Note Issued',
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?1`
      ).bind(originalRecordId)
    ]);

    await auditEvent(db, request, {
      eventType: "finance.credit_note.create",
      entityType: "financial_record",
      entityId: creditNoteId,
      outcome: "success",
      user,
      metadata: {
        originalRecordId,
        originalItemType: original.item_type,
        amountExVat,
        vatAmount,
        amountIncVat,
        reason
      }
    });

    return json({ ok: true, creditNoteId, amountIncVat });
  } catch (error: any) {
    await auditError(db, request, error, { user: user ?? null, metadata: { message: "credit note creation failed" } });
    return serverError("The credit note could not be created.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}

