import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { forbidden, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.js";

export const prerender = false;

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (!["finance", "admin"].includes(user.role)) return forbidden("Only finance or admin accounts can export ledger data.");

    const db = getDatabase();
    const rows = (await db
      .prepare(
        `SELECT financial_records.id, financial_records.reference, financial_records.item_type,
                financial_records.payment_status, financial_records.amount, financial_records.distribution_date,
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

    const header = ["id", "reference", "type", "status", "amount", "distribution_date", "job_id", "client", "billing_emails"];
    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.reference,
          row.item_type,
          row.payment_status,
          Number(row.amount || 0).toFixed(2),
          row.distribution_date,
          row.job_id,
          row.owner_company_name,
          row.billing_emails
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
  } catch (error) {
    console.error("finance export failed", error);
    return serverError("Finance export could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["GET"]);
}
