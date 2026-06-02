import type { D1Database } from "@cloudflare/workers-types";

export interface TechJob {
  id: string;
  system_id: string;
  scheduled_date: string;
  status: string;
  site_notes: string | null;
  job_type: string;
  priority: string;
  required_by_date: string | null;
  is_emergency: number;
  estimated_duration_minutes: number | null;
  system_type: string;
  coverage_area: string;
  owner_company_name: string;
  physical_address: string | null;
  assigned_technician_id: string | null;
}

export class JobService {
  constructor(private db: D1Database) {}

  async getTechDashboardJobs(userId: string, role: string): Promise<TechJob[]> {
    const query = role === "admin"
      ? `SELECT jobs.id, jobs.system_id, jobs.scheduled_date, jobs.status, jobs.site_notes,
                jobs.job_type, jobs.priority, jobs.required_by_date, jobs.is_emergency,
                jobs.assigned_technician_id,
                systems.system_type, systems.coverage_area,
                sites.owner_company_name, sites.physical_address
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.status IN ('Scheduled', 'In Progress')
         ORDER BY jobs.scheduled_date ASC
         LIMIT 100`
      : `SELECT jobs.id, jobs.system_id, jobs.scheduled_date, jobs.status, jobs.site_notes,
                jobs.job_type, jobs.priority, jobs.required_by_date, jobs.is_emergency, jobs.assigned_technician_id,
                systems.system_type, systems.coverage_area,
                sites.owner_company_name, sites.physical_address
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.assigned_technician_id = ?1 AND jobs.status IN ('Scheduled', 'In Progress')
         ORDER BY jobs.scheduled_date ASC
         LIMIT 100`;

    const result = role === "admin"
      ? await this.db.prepare(query).all()
      : await this.db.prepare(query).bind(userId).all();
    
    return (result.results || []) as unknown as TechJob[];
  }

  async getUpcomingSchedule(userId: string, role: string, today: string): Promise<TechJob[]> {
    const query = role === "admin"
      ? `SELECT jobs.id, jobs.system_id, jobs.scheduled_date, jobs.status, jobs.site_notes,
                jobs.job_type, jobs.priority, jobs.required_by_date, jobs.is_emergency, jobs.assigned_technician_id,
                systems.system_type, systems.coverage_area,
                sites.owner_company_name, sites.physical_address
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.status IN ('Scheduled', 'In Progress')
           AND jobs.scheduled_date > ?1
         ORDER BY jobs.scheduled_date ASC
         LIMIT 100`
      : `SELECT jobs.id, jobs.system_id, jobs.scheduled_date, jobs.status, jobs.site_notes,
                jobs.job_type, jobs.priority, jobs.required_by_date, jobs.is_emergency, jobs.assigned_technician_id,
                systems.system_type, systems.coverage_area,
                sites.owner_company_name, sites.physical_address
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.assigned_technician_id = ?1
           AND jobs.status IN ('Scheduled', 'In Progress')
           AND jobs.scheduled_date > ?2
         ORDER BY jobs.scheduled_date ASC
         LIMIT 100`;

    const result = role === "admin"
      ? await this.db.prepare(query).bind(today).all()
      : await this.db.prepare(query).bind(userId, today).all();
    
    return (result.results || []) as unknown as TechJob[];
  }
}
