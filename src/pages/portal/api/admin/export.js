import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { rowsToCsv } from "../../../../lib/server/csv";
import { badRequest, methodNotAllowed } from "../../../../lib/server/http.ts";
import { requireAdmin } from "../../../../lib/server/access";

export const prerender = false;

const configs = {
  users: {
    filename: "kharon-users.csv",
    headers: ["id", "name", "email", "role", "site_id", "is_active", "force_password_change", "mfa_required", "mfa_enabled", "last_login_at"],
    sql: `SELECT id, name, email, role, site_id, is_active, force_password_change, mfa_required, mfa_enabled, last_login_at
          FROM users
          ORDER BY role, name`
  },
  sites: {
    filename: "kharon-sites.csv",
    headers: ["id", "owner_company_name", "physical_address", "site_contact_person", "site_contact_email", "site_contact_phone", "billing_emails"],
    sql: `SELECT id, owner_company_name, physical_address, site_contact_person, site_contact_email, site_contact_phone, billing_emails
          FROM sites
          ORDER BY owner_company_name`
  },
  systems: {
    filename: "kharon-systems.csv",
    headers: ["id", "site_id", "system_type", "coverage_area", "manufacturer", "model_reference", "next_due_date"],
    sql: `SELECT id, site_id, system_type, coverage_area, manufacturer, model_reference, next_due_date
          FROM systems
          WHERE deleted_at IS NULL
          ORDER BY site_id, coverage_area`
  },
  contacts: {
    filename: "kharon-contact-submissions.csv",
    headers: ["id", "name", "email", "request_type", "message", "submitted_at"],
    sql: `SELECT id, name, email, request_type, message, submitted_at
          FROM contact_submissions
          ORDER BY submitted_at DESC`
  }
};

export async function GET({ request, locals, url }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const type = String(url.searchParams.get("type") || "");
  const config = configs[type];
  if (!config) return badRequest("Export type is invalid.");

  const db = getDatabase();
  const rows = (await db.prepare(config.sql).all()).results || [];

  await auditEvent(db, request, {
    eventType: `admin.export.${type}`,
    entityType: type,
    outcome: "success",
    user: locals.user,
    metadata: { rows: rows.length }
  });

  return new Response(rowsToCsv(config.headers, rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${config.filename}"`,
      "cache-control": "no-store"
    }
  });
}

export function ALL() {
  return methodNotAllowed(["GET"]);
}