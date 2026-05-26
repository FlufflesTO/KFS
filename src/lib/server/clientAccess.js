import { auditError } from "./audit.js";
export async function clientSiteIds(db, user) {
  if (!user || user.role !== "client") return [];

  const ids = new Set();
  if (user.siteId) ids.add(String(user.siteId));

  let rows = [];
  try {
    rows = (await db
      .prepare(
        `SELECT site_id
         FROM client_site_access
         WHERE user_id = ?1`
      )
      .bind(user.id)
      .all()).results || [];
  } catch (error) {
    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "client site access mapping load failed" } });
  }

  for (const row of rows) {
    if (row.site_id) ids.add(String(row.site_id));
  }

  return [...ids];
}

export async function clientSites(db, user) {
  const ids = await clientSiteIds(db, user);
  if (ids.length === 0) return [];

  const placeholders = ids.map((_, index) => `?${index + 1}`).join(", ");
  return (await db
    .prepare(
      `SELECT id, owner_company_name, physical_address, site_contact_person, site_contact_email, site_contact_phone
       FROM sites
       WHERE id IN (${placeholders})
       ORDER BY owner_company_name ASC`
    )
    .bind(...ids)
    .all()).results || [];
}

export async function clientCanAccessSite(db, user, siteId) {
  if (!siteId) return false;
  const ids = await clientSiteIds(db, user);
  return ids.includes(String(siteId));
}

export function inClause(values, startIndex = 1) {
  return values.map((_, index) => `?${startIndex + index}`).join(", ");
}
