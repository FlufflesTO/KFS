import { getDatabase } from "../../../lib/server/bindings.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

export async function POST({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (user.role !== "client") return forbidden("Only client accounts can approve quotes.");
    if (!user.siteId) return forbidden("Client account is not mapped to a site.");

    const body = await request.json();
    const recordId = String(body.recordId || "").trim();
    if (!/^[A-Za-z0-9_-]{3,80}$/.test(recordId)) {
      return badRequest("recordId is invalid.");
    }

    const db = getDatabase();
    const record = await db
      .prepare(
        `SELECT id, site_id, item_type, payment_status
         FROM financial_records
         WHERE id = ?1
         LIMIT 1`
      )
      .bind(recordId)
      .first();

    if (!record || record.site_id !== user.siteId) {
      return forbidden("Quote approval is not permitted for this account.");
    }

    if (record.item_type !== "Quote" || record.payment_status !== "Pending Approval") {
      return badRequest("Only pending quote records can be approved.");
    }

    await db
      .prepare(
        `UPDATE financial_records
         SET item_type = 'Invoice',
             payment_status = 'Unpaid',
             distribution_date = date('now')
         WHERE id = ?1`
      )
      .bind(recordId)
      .run();

    return json({ ok: true, recordId, itemType: "Invoice", paymentStatus: "Unpaid" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    console.error("quote approval failed", error);
    return serverError("Quote approval could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
