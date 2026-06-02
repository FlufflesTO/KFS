import type { D1Database } from "@cloudflare/workers-types";
import type { DbSite } from "@sentinel/types";

export class SiteRepository {
  constructor(private db: D1Database) {}

  async listSites(searchQuery?: string, limit = 50, offset = 0): Promise<{ sites: DbSite[]; total: number }> {
    let searchCondition = "";
    const bindParams: any[] = [];

    if (searchQuery) {
      searchCondition += ` AND (owner_company_name LIKE ? OR site_contact_person LIKE ? OR site_contact_email LIKE ?)`;
      const q = `%${searchQuery}%`;
      bindParams.push(q, q, q);
    }

    const countQuery = `SELECT COUNT(*) as total FROM sites WHERE deleted_at IS NULL ${searchCondition}`;
    const totalResult = await this.db.prepare(countQuery).bind(...bindParams).first<{ total: number }>();
    const total = totalResult?.total ?? 0;

    const dataQuery = `
      SELECT id, owner_company_name, physical_address, site_contact_person, site_contact_email, site_contact_phone, billing_emails
      FROM sites
      WHERE deleted_at IS NULL ${searchCondition}
      ORDER BY owner_company_name
      LIMIT ? OFFSET ?
    `;

    const { results } = await this.db.prepare(dataQuery).bind(...bindParams, limit, offset).all();
    return {
      sites: (results || []) as unknown as DbSite[],
      total
    };
  }

  async getSiteAccessMappings(): Promise<any[]> {
    const { results } = await this.db.prepare(
      `SELECT client_site_access.user_id, client_site_access.site_id, client_site_access.granted_at,
              users.name AS user_name, users.email AS user_email, sites.owner_company_name
       FROM client_site_access
       INNER JOIN users ON users.id = client_site_access.user_id
       INNER JOIN sites ON sites.id = client_site_access.site_id
       ORDER BY users.name, sites.owner_company_name
       LIMIT 1000`
    ).all();
    return results || [];
  }
}
