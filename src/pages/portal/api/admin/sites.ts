import type { APIRoute } from "astro";
import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http";
import { cleanEmail, cleanId, cleanText, readJson, requireAdmin } from "../../../../lib/server/access";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  let db: ReturnType<typeof getDatabase>;
  try {
    db = getDatabase();

    const body = await readJson(request) as Record<string, any>;
    const action = String(body.action || "create");
    const id = action === "create" ? crypto.randomUUID() : cleanId(body.id, "id");
    if (!id) return badRequest("id is required.");
    const ownerCompanyName = cleanText(body.ownerCompanyName, "ownerCompanyName", { min: 2, max: 200 });
    const physicalAddress = cleanText(body.physicalAddress, "physicalAddress", { min: 5, max: 500 });
    const siteContactPerson = cleanText(body.siteContactPerson, "siteContactPerson", { min: 2, max: 160 });
    const siteContactEmail = cleanEmail(body.siteContactEmail, "siteContactEmail", { required: false });
    const siteContactPhone = cleanText(body.siteContactPhone, "siteContactPhone", { required: false, max: 80 });
    const billingEmails = cleanText(body.billingEmails, "billingEmails", { min: 3, max: 1000 });

    if (action === "create") {
      await db
        .prepare(
          `INSERT INTO sites
             (id, owner_company_name, physical_address, site_contact_person, site_contact_email, site_contact_phone, billing_emails)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
        )
        .bind(id, ownerCompanyName, physicalAddress, siteContactPerson, siteContactEmail, siteContactPhone, billingEmails)
        .run();
    } else if (action === "update") {
      await db
        .prepare(
          `UPDATE sites
           SET owner_company_name = ?1,
               physical_address = ?2,
               site_contact_person = ?3,
               site_contact_email = ?4,
               site_contact_phone = ?5,
               billing_emails = ?6
           WHERE id = ?7`
        )
        .bind(ownerCompanyName, physicalAddress, siteContactPerson, siteContactEmail, siteContactPhone, billingEmails, id)
        .run();
    } else {
      return badRequest("action is invalid.");
    }

    await auditEvent(db, request, {
      eventType: `admin.site.${action}`,
      entityType: "site",
      entityId: id,
      outcome: "success",
      user: locals.user
    });

    return json({ ok: true, id });
  } catch (error) {
    if (error instanceof Error && error.message) return badRequest(error.message);
    await auditError(db!, request, error as Error, { user: locals.user || undefined, metadata: { message: "admin sites failed" } });
    return serverError("Site administration failed.");
  }
};

export const ALL: APIRoute = () => {
  return methodNotAllowed(["POST"]);
};
