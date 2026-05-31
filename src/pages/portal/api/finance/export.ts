
import { auditError } from "../../../../lib/server/audit";
/**
 * Project Sentinel - Finance Export API
 * Purpose: Exports the finance operational queue ledger to CSV format
 * Dependencies: ../../../../lib/server/bindings.ts, ../../../../lib/server/audit, ../../../../lib/server/http.ts
 * Structural Role: REST API controller for CSV report download
 */

import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { forbidden, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.ts";

export const prerender = false;

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET({ request, locals }: import('astro').APIContext) {
  const user = locals.user;
  const db = getDatabase();
  try {
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) return forbidden("Only finance or admin accounts can export ledger data.");

    const rows = (await db
      .prepare(
        `SELECT financial_records.id, financial_records.reference, financial_records.item_type,
                financial_records.item_subtype, financial_records.payment_status,
                financial_records.amount, financial_records.sage_amount_ex_vat,
                financial_records.sage_vat_amount, financial_records.sage_amount_inc_vat,
                financial_records.distribution_date, financial_records.sage_document_date,
                financial_records.sage_due_date,
                financial_records.sage_invoice_number, financial_records.sage_quote_number,
                financial_records.sage_customer_code, financial_records.finance_task_status,
                financial_records.finance_notes, financial_records.credit_note_for_id,
                financial_records.job_id, sites.owner_company_name, sites.billing_emails
         FROM financial_records
         INNER JOIN sites ON sites.id = financial_records.site_id
         ORDER BY financial_records.distribution_date DESC, financial_records.created_at DESC`
      )
      .all()).results || [];

    await auditEvent(db, request, {
      eventType: "finance.export",
      entityType: "financial_records",
      entityId: "csv",
      outcome: "success",
      user,
      metadata: { rowCount: rows.length }
    });

    const header = [
      "id", "reference", "type", "item_subtype", "status",
      "amount_inc_vat", "amount_ex_vat", "vat_amount",
      "distribution_date", "sage_document_date", "sage_due_date",
      "sage_invoice_number", "sage_quote_number", "sage_customer_code",
      "finance_task_status", "finance_notes", "credit_note_for_id",
      "job_id", "client", "billing_emails"
    ];
    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.reference,
          row.item_type,
          row.item_subtype || "",
          row.payment_status,
          (Number(row.sage_amount_inc_vat ?? row.amount ?? 0) / 100).toFixed(2),
          (Number(row.sage_amount_ex_vat ?? 0) / 100).toFixed(2),
          (Number(row.sage_vat_amount ?? 0) / 100).toFixed(2),
          row.distribution_date,
          row.sage_document_date || "",
          row.sage_due_date || "",
          row.sage_invoice_number || "",
          row.sage_quote_number || "",
          row.sage_customer_code || "",
          row.finance_task_status || "",
          row.finance_notes || "",
          row.credit_note_for_id || "",
          row.job_id || "",
          row.owner_company_name,
          row.billing_emails || ""
        ].map(csvCell).join(",")
      )
    ];

    return new Response(lines.join("\r\n"), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="kharon-finance-ledger-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (error: any) {
    await auditError(db, request, error, { user: user ?? null, metadata: { message: "finance export failed" } });
    return serverError("Finance export could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["GET"]);
}

