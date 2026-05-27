import { auditError } from "../../../../lib/server/audit.js";
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit.js";
import { rowsToCsv } from "../../../../lib/server/csv.js";
import { forbidden, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.ts";

export const prerender = false;

const CATEGORY_PATTERNS = {
  auth:     "auth.%",
  admin:    "admin.%",
  finance:  "finance.%",
  job:      "job%",
  security: "security.%",
  document: "document.%"
};

const ALLOWED_OUTCOMES = new Set(["success", "failure", "blocked"]);

export async function GET({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (user.role !== "admin") return forbidden("Only admin accounts can export audit data.");

    const url = new URL(request.url);
    const filterCategory = url.searchParams.get("category") || "";
    const filterOutcome  = url.searchParams.get("outcome")  || "";
    const filterFrom     = url.searchParams.get("from")     || "";
    const filterTo       = url.searchParams.get("to")       || "";

    const conditions = [];
    const params     = [];

    if (filterCategory && CATEGORY_PATTERNS[filterCategory]) {
      conditions.push("ae.event_type LIKE ?");
      params.push(CATEGORY_PATTERNS[filterCategory]);
    }
    if (filterOutcome && ALLOWED_OUTCOMES.has(filterOutcome)) {
      conditions.push("ae.outcome = ?");
      params.push(filterOutcome);
    }
    if (filterFrom) {
      conditions.push("date(ae.created_at) >= ?");
      params.push(filterFrom);
    }
    if (filterTo) {
      conditions.push("date(ae.created_at) <= ?");
      params.push(filterTo);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `
      SELECT ae.id, ae.created_at, ae.actor_role, ae.event_type,
             ae.entity_type, ae.entity_id, ae.outcome, ae.metadata_json,
             u.name AS actor_name, u.email AS actor_email
      FROM audit_events ae
      LEFT JOIN users u ON u.id = ae.actor_user_id
      ${whereClause}
      ORDER BY ae.created_at DESC
      LIMIT 2000`;

    const db   = getDatabase();
    const stmt = db.prepare(sql);
    const rows = ((await (params.length > 0 ? stmt.bind(...params) : stmt).all()).results || []);

    await auditEvent(db, request, {
      eventType:  "admin.audit_export",
      entityType: "audit_events",
      entityId:   "csv",
      outcome:    "success",
      user,
      metadata:   { rowCount: rows.length, filterCategory, filterOutcome, filterFrom, filterTo }
    });

    const headers = [
      "id", "created_at", "actor_name", "actor_email", "actor_role",
      "event_type", "entity_type", "entity_id", "outcome", "metadata_json"
    ];
    const csv  = rowsToCsv(headers, rows);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type":        "text/csv; charset=utf-8",
        "cache-control":       "no-store",
        "content-disposition": `attachment; filename="kharon-audit-${date}.csv"`
      }
    });
  } catch (error) {
    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "audit export failed" } });
    return serverError("Audit export could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["GET"]);
}
