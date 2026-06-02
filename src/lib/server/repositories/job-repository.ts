import type { D1Database } from "@cloudflare/workers-types";

export interface JobHistoryRecord {
  id: string;
  completed_at: string | null;
  status: string;
  job_type: string;
  system_type: string;
  coverage_area: string;
  owner_company_name: string;
}

export class JobRepository {
  constructor(private db: D1Database) {}

  async getJobHistory(userId: string, role: string): Promise<JobHistoryRecord[]> {
    const isAdmin = role === "admin";
    const query = isAdmin
      ? `SELECT jobs.id, jobs.completed_at, jobs.status, jobs.job_type,
                systems.system_type, systems.coverage_area,
                sites.owner_company_name
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.status IN ('Completed', 'Invoiced')
         ORDER BY jobs.completed_at DESC
         LIMIT 200`
      : `SELECT jobs.id, jobs.completed_at, jobs.status, jobs.job_type,
                systems.system_type, systems.coverage_area,
                sites.owner_company_name
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.assigned_technician_id = ?1
           AND jobs.status IN ('Completed', 'Invoiced')
         ORDER BY jobs.completed_at DESC
         LIMIT 100`;

    const stmt = this.db.prepare(query);
    const result = await (isAdmin ? stmt.all() : stmt.bind(userId).all());
    
    return (result.results || []) as unknown as JobHistoryRecord[];
  }
}
