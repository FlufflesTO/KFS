/**
 * Project Sentinel - Database Query Optimization Services
 * Purpose: Provides optimized database access methods including batch queries, dashboard analytics, and client data retrieval
 * Dependencies: ./bindings.ts
 * Structural Role: Performance-optimized database read/query layer
 */

import { getDatabase } from "./bindings";

export interface JobWithDetails {
  id: string;
  system_id: string;
  scheduled_date: string;
  status: string;
  site_notes: string;
  job_type: string;
  priority: string;
  required_by_date: string;
  is_emergency: number;
  system_type: string;
  coverage_area: string;
  owner_company_name: string;
  physical_address: string;
  technician_name: string;
}

export interface DashboardStats {
  activeJobs: number;
  unassignedJobs: number;
  overdueSystems: number;
  openRequests: number;
  missingDocuments: number;
  openDefects: number;
  criticalDefects: number;
  blockedCertificates: number;
  validCertificates: number;
}

/**
 * Optimized function to get technician dashboard data with single query
 */
export async function getTechDashboardData(techId: string): Promise<JobWithDetails[]> {
  // Single query with JOINs instead of multiple queries
  const result = await getDatabase().prepare(`
    SELECT 
      j.id,
      j.system_id,
      j.scheduled_date,
      j.status,
      j.site_notes,
      j.job_type,
      j.priority,
      j.required_by_date,
      j.is_emergency,
      s.system_type,
      s.coverage_area,
      si.owner_company_name,
      si.physical_address,
      u.name as technician_name
    FROM jobs j
    LEFT JOIN systems s ON s.id = j.system_id
    LEFT JOIN sites si ON si.id = s.site_id
    LEFT JOIN users u ON u.id = j.assigned_technician_id
    WHERE j.assigned_technician_id = ?
    AND j.deleted_at IS NULL
    AND s.deleted_at IS NULL
    AND j.status IN ('Scheduled', 'In Progress')
    ORDER BY j.scheduled_date ASC
  `).bind(techId).all();

  return result.results as unknown as JobWithDetails[] || [];
}

/**
 * Batch query to get all dashboard statistics efficiently
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDatabase();
  
  const [activeJobs, unassignedJobs, overdueSystems, openRequests, missingDocuments,
         openDefects, criticalDefects, blockedCertificates, validCertificates] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS n FROM jobs WHERE deleted_at IS NULL AND status IN ('Scheduled', 'In Progress')`),
    db.prepare(`SELECT COUNT(*) AS n FROM jobs WHERE deleted_at IS NULL AND status IN ('Scheduled', 'In Progress') AND assigned_technician_id IS NULL`),
    db.prepare(`SELECT COUNT(*) AS n FROM systems WHERE deleted_at IS NULL AND date(next_due_date) < date('now')`),
    db.prepare(`SELECT COUNT(*) AS n FROM maintenance_requests WHERE status IN ('New', 'Reviewing')`),
    db.prepare(`SELECT COUNT(*) AS n FROM jobs WHERE deleted_at IS NULL AND status IN ('Completed', 'Invoiced') AND documentation_path IS NULL`),
    db.prepare(`SELECT COUNT(*) AS n FROM defects WHERE deleted_at IS NULL AND status = 'Open'`),
    db.prepare(`SELECT COUNT(*) AS n FROM defects WHERE deleted_at IS NULL AND status = 'Open' AND severity = 'Critical'`),
    db.prepare(`SELECT COUNT(*) AS n FROM certificates WHERE deleted_at IS NULL AND status = 'Blocked'`),
    db.prepare(`SELECT COUNT(*) AS n FROM certificates WHERE deleted_at IS NULL AND status = 'Valid'`)
  ]);

  interface CountResult {
    n: number;
  }
  
  return {
    activeJobs: (activeJobs?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    unassignedJobs: (unassignedJobs?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    overdueSystems: (overdueSystems?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    openRequests: (openRequests?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    missingDocuments: (missingDocuments?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    openDefects: (openDefects?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    criticalDefects: (criticalDefects?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    blockedCertificates: (blockedCertificates?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0,
    validCertificates: (validCertificates?.results?.[0] as unknown as CountResult | undefined)?.n ?? 0
  };
}

/**
 * Batch query to get multiple related records efficiently
 */
export interface BatchRecords {
  jobs?: unknown[];
  systems?: unknown[];
  sites?: unknown[];
}

export async function getBatchRecords(batchParams: {
  jobIds?: string[];
  systemIds?: string[];
  siteIds?: string[];
}): Promise<BatchRecords> {
  const db = getDatabase();
  const results: BatchRecords = {};

  const queryDefs: Array<{ sql: string; params: string[]; key: keyof BatchRecords }> = [];

  if (batchParams.jobIds && batchParams.jobIds.length > 0) {
    const placeholders = batchParams.jobIds.map(() => '?').join(',');
    queryDefs.push({ sql: `SELECT * FROM jobs WHERE deleted_at IS NULL AND id IN (${placeholders})`, params: batchParams.jobIds, key: 'jobs' });
  }
  if (batchParams.systemIds && batchParams.systemIds.length > 0) {
    const placeholders = batchParams.systemIds.map(() => '?').join(',');
    queryDefs.push({ sql: `SELECT * FROM systems WHERE deleted_at IS NULL AND id IN (${placeholders})`, params: batchParams.systemIds, key: 'systems' });
  }
  if (batchParams.siteIds && batchParams.siteIds.length > 0) {
    const placeholders = batchParams.siteIds.map(() => '?').join(',');
    queryDefs.push({ sql: `SELECT * FROM sites WHERE id IN (${placeholders})`, params: batchParams.siteIds, key: 'sites' });
  }

  for (const { sql, params, key } of queryDefs) {
    const result = await db.prepare(sql).bind(...params).all();
    results[key] = result.results || [];
  }

  return results;
}

export interface ClientDashboardData {
  systems: unknown[];
  quotes: unknown[];
  requests: unknown[];
  openDefects: unknown[];
  certificates: unknown[];
}

/**
 * Optimized function to get client dashboard data with proper JOINs
 */
export async function getClientDashboardData(siteIds: string[]): Promise<ClientDashboardData> {
  const db = getDatabase();
  const sitePlaceholders = siteIds.map(() => '?').join(',');

  // ⚡ Bolt: Execute all queries in a single db.batch to avoid multiple HTTP roundtrips to D1
  const [systemsResult, quotesResult, requestsResult, openDefectsResult, certificatesResult] = await db.batch([
    db.prepare(
      `SELECT systems.id, systems.site_id, systems.system_type, systems.coverage_area, systems.last_service_date, systems.next_due_date,
              sites.owner_company_name,
              latest_jobs.id AS latest_job_id, latest_jobs.documentation_path, latest_jobs.completed_at
       FROM systems
       INNER JOIN sites ON sites.id = systems.site_id
       LEFT JOIN jobs AS latest_jobs ON latest_jobs.id = (
         SELECT j.id FROM jobs j
         WHERE j.deleted_at IS NULL AND j.system_id = systems.id AND j.documentation_path IS NOT NULL
         ORDER BY COALESCE(j.completed_at, j.updated_at, j.created_at) DESC
         LIMIT 1
       )
       WHERE systems.deleted_at IS NULL AND systems.site_id IN (${sitePlaceholders})
       ORDER BY sites.owner_company_name ASC, systems.next_due_date ASC`
    ).bind(...siteIds),

    db.prepare(
      `SELECT financial_records.id, financial_records.site_id, financial_records.amount,
              financial_records.item_type, financial_records.payment_status,
              financial_records.distribution_date, financial_records.reference,
              sites.owner_company_name
       FROM financial_records
       INNER JOIN sites ON sites.id = financial_records.site_id
       WHERE financial_records.site_id IN (${sitePlaceholders})
         AND financial_records.item_type = 'Quote'
         AND financial_records.payment_status = 'Pending Approval'
       ORDER BY financial_records.distribution_date ASC`
    ).bind(...siteIds),

    db.prepare(
      `SELECT maintenance_requests.id, maintenance_requests.site_id,
              maintenance_requests.request_type, maintenance_requests.priority,
              maintenance_requests.status, maintenance_requests.subject, maintenance_requests.created_at,
              maintenance_requests.linked_job_id, systems.coverage_area, sites.owner_company_name
       FROM maintenance_requests
       INNER JOIN sites ON sites.id = maintenance_requests.site_id
       LEFT JOIN systems ON systems.id = maintenance_requests.system_id AND systems.deleted_at IS NULL
       WHERE maintenance_requests.site_id IN (${sitePlaceholders})
       ORDER BY maintenance_requests.created_at DESC
       LIMIT 8`
    ).bind(...siteIds),

    db.prepare(
      `SELECT defects.id, defects.severity, defects.sans_clause_ref, defects.status,
              defects.remediation_notes, systems.id AS system_id, systems.system_type,
              systems.coverage_area, sites.owner_company_name
       FROM defects
       INNER JOIN systems ON systems.id = defects.system_id
       INNER JOIN sites ON sites.id = systems.site_id
       WHERE defects.deleted_at IS NULL AND systems.deleted_at IS NULL
         AND systems.site_id IN (${sitePlaceholders}) AND defects.status IN ('Open', 'In Progress')
       ORDER BY CASE defects.severity WHEN 'Critical' THEN 1 WHEN 'Major' THEN 2 ELSE 3 END,
                defects.created_at DESC
       LIMIT 10`
    ).bind(...siteIds),

    db.prepare(
      `SELECT certificates.id, certificates.certificate_type, certificates.status,
              certificates.issued_date, certificates.expiry_date,
              systems.id AS system_id, systems.system_type, systems.coverage_area,
              sites.owner_company_name
       FROM certificates
       INNER JOIN systems ON systems.id = certificates.system_id
       INNER JOIN sites ON sites.id = systems.site_id
       WHERE certificates.deleted_at IS NULL AND systems.deleted_at IS NULL
         AND systems.site_id IN (${sitePlaceholders})
       ORDER BY COALESCE(certificates.expiry_date, certificates.issued_date) DESC
       LIMIT 10`
    ).bind(...siteIds)
  ]);

  return {
    systems: systemsResult?.results || [],
    quotes: quotesResult?.results || [],
    requests: requestsResult?.results || [],
    openDefects: openDefectsResult?.results || [],
    certificates: certificatesResult?.results || []
  };
}
