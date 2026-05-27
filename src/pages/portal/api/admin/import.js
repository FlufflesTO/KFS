import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { csvObjects } from "../../../../lib/server/csv";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.ts";
import { cleanChoice, cleanDate, cleanEmail, cleanId, cleanText, readJson, requireAdmin } from "../../../../lib/server/access";

export const prerender = false;

const siteHeaders = ["id", "owner_company_name", "physical_address", "site_contact_person", "site_contact_email", "site_contact_phone", "billing_emails"];
const systemHeaders = ["id", "site_id", "system_type", "coverage_area", "manufacturer", "model_reference", "next_due_date"];
const systemTypes = ["Gas Suppression", "Fire Detection"];

function cleanImportId(value) {
  return value ? cleanId(value, "id", { required: false }) : crypto.randomUUID();
}

async function siteExists(db, id) {
  if (!id) return false;
  const record = await db.prepare(`SELECT id FROM sites WHERE id = ?1 LIMIT 1`).bind(id).first();
  return Boolean(record);
}

async function systemExists(db, id) {
  if (!id) return false;
  const record = await db.prepare(`SELECT id FROM systems WHERE deleted_at IS NULL AND id = ?1 LIMIT 1`).bind(id).first();
  return Boolean(record);
}

async function importSites(db, rows, isDryRun) {
  const results = [];
  for (const row of rows) {
    try {
      const data = row.data;
      const id = cleanImportId(data.id);
      const ownerCompanyName = cleanText(data.owner_company_name, "owner_company_name", { min: 2, max: 200 });
      const physicalAddress = cleanText(data.physical_address, "physical_address", { min: 5, max: 500 });
      const siteContactPerson = cleanText(data.site_contact_person, "site_contact_person", { min: 2, max: 160 });
      const siteContactEmail = cleanEmail(data.site_contact_email, "site_contact_email", { required: false });
      const siteContactPhone = cleanText(data.site_contact_phone, "site_contact_phone", { required: false, max: 80 });
      const billingEmails = cleanText(data.billing_emails, "billing_emails", { min: 3, max: 1000 });
      const exists = await siteExists(db, id);

      if (exists) {
        if (!isDryRun) {
          await db
            .prepare(
              `UPDATE sites
               SET owner_company_name = ?1,
                   physical_address = ?2,
                   site_contact_person = ?3,
                   site_contact_email = ?4,
                   site_contact_phone = ?5,
                   billing_emails = ?6
               WHERE id = ?7 AND deleted_at IS NULL`
            )
            .bind(ownerCompanyName, physicalAddress, siteContactPerson, siteContactEmail, siteContactPhone, billingEmails, id)
            .run();
        }
      } else {
        if (!isDryRun) {
          await db
            .prepare(
              `INSERT INTO sites
                 (id, owner_company_name, physical_address, site_contact_person, site_contact_email, site_contact_phone, billing_emails)
               VALUES
                 (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
            )
            .bind(id, ownerCompanyName, physicalAddress, siteContactPerson, siteContactEmail, siteContactPhone, billingEmails)
            .run();
        }
      }

      results.push({ row: row.rowNumber, id, ok: true, action: exists ? "updated" : "created" });
    } catch (error) {
      results.push({ row: row.rowNumber, ok: false, message: error.message || "Row import failed." });
    }
  }
  return results;
}

async function importSystems(db, rows, isDryRun) {
  const results = [];
  for (const row of rows) {
    try {
      const data = row.data;
      const id = cleanImportId(data.id);
      const siteId = cleanId(data.site_id, "site_id");
      const site = await db.prepare(`SELECT id FROM sites WHERE id = ?1 LIMIT 1`).bind(siteId).first();
      if (!site) throw new Error("site_id does not match an existing site.");

      const systemType = cleanChoice(data.system_type, "system_type", systemTypes);
      const coverageArea = cleanText(data.coverage_area, "coverage_area", { min: 2, max: 200 });
      const manufacturer = cleanText(data.manufacturer, "manufacturer", { required: false, max: 120 });
      const modelReference = cleanText(data.model_reference, "model_reference", { required: false, max: 120 });
      const nextDueDate = cleanDate(data.next_due_date, "next_due_date");
      const exists = await systemExists(db, id);

      if (exists) {
        if (!isDryRun) {
          await db
            .prepare(
              `UPDATE systems
               SET site_id = ?1,
                   system_type = ?2,
                   coverage_area = ?3,
                   manufacturer = ?4,
                   model_reference = ?5,
                   next_due_date = ?6
               WHERE id = ?7`
            )
            .bind(siteId, systemType, coverageArea, manufacturer, modelReference, nextDueDate, id)
            .run();
        }
      } else {
        if (!isDryRun) {
          await db
            .prepare(
              `INSERT INTO systems
                 (id, site_id, system_type, coverage_area, manufacturer, model_reference, next_due_date)
               VALUES
                 (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
            )
            .bind(id, siteId, systemType, coverageArea, manufacturer, modelReference, nextDueDate)
            .run();
        }
      }

      results.push({ row: row.rowNumber, id, ok: true, action: exists ? "updated" : "created" });
    } catch (error) {
      results.push({ row: row.rowNumber, ok: false, message: error.message || "Row import failed." });
    }
  }
  return results;
}

export async function POST({ request, locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const type = cleanChoice(body.type, "type", ["sites", "systems"]);
    const csv = cleanText(body.csv, "csv", { min: 5, max: 250000 });
    const isDryRun = Boolean(body.dryRun);
    const rows = csvObjects(csv, type === "sites" ? siteHeaders : systemHeaders);
    if (rows.length > 250) return badRequest("Import is limited to 250 rows per request.");

    const results = type === "sites" ? await importSites(db, rows, isDryRun) : await importSystems(db, rows, isDryRun);
    const failures = results.filter((row) => !row.ok);

    await auditEvent(db, request, {
      eventType: `admin.import.${type}`,
      entityType: type,
      outcome: failures.length ? "failure" : "success",
      user: locals.user,
      metadata: {
        rows: results.length,
        failures: failures.length,
        dryRun: isDryRun
      }
    });

    return json({ ok: failures.length === 0, type, isDryRun, results, failures });
  } catch (error) {
    if (error.message) return badRequest(error.message);
    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "admin import failed" } });
    return serverError("Import could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
