import type { D1Database } from "@cloudflare/workers-types";
import type { DbJob, DbLinkableJob } from "@sentinel/types";

/**
 * JobRepository
 * Abstraction layer for jobs table with built-in soft delete (deleted_at IS NULL) filtering.
 */
export class JobRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<DbJob | null> {
    const job = await this.db
      .prepare(`SELECT * FROM jobs WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(id)
      .first<DbJob>();
    return job || null;
  }

  async findAllActive(): Promise<DbLinkableJob[]> {
    const { results } = await this.db
      .prepare(`
        SELECT j.id, j.job_type, j.status, s.owner_company_name as client_name
        FROM jobs j
        JOIN systems sys ON j.system_id = sys.id
        JOIN sites s ON sys.site_id = s.id
        WHERE j.deleted_at IS NULL AND s.deleted_at IS NULL AND sys.deleted_at IS NULL
        ORDER BY j.scheduled_date DESC
      `)
      .all<DbLinkableJob>();
    return results || [];
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .prepare(`UPDATE jobs SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?1`)
      .bind(id)
      .run();
  }
}
