/**
 * Project Sentinel - Dashboard Service
 * Purpose: Provides data aggregation and statistics for the admin and client dashboards
 * Dependencies: @cloudflare/workers-types, ../access
 * Structural Role: Service Layer
 */

import type { D1Database } from "@cloudflare/workers-types";
import { clientSites, inClause } from "../access";

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

export interface ClientSiteAggregate {
  id: string;
  owner_company_name: string;
  system_count: number;
  overdue_count: number;
  due_soon_count: number;
  defect_count: number;
  critical_count: number;
}

export interface ClientDashboardData {
  siteAggregates: ClientSiteAggregate[];
  pendingQuoteCount: number;
  pendingQuoteAmount: number;
  openRequestCount: number;
}

export class DashboardService {
  constructor(private db: D1Database) {}

  async getAdminStats(): Promise<DashboardStats> {
    // ⚡ Bolt: Optimize by consolidating repeated COUNT(*) queries on the same table using conditional aggregation. This prevents multiple full index scans, improving DB performance. The base WHERE clause is preserved to ensure index usage.
    const [
      jobsStats,
      cntOverdue,
      cntRequests,
      defectsStats,
      certificatesStats
    ] = await this.db.batch([
      this.db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN jobs.status IN ('Scheduled', 'In Progress') THEN 1 ELSE 0 END), 0) AS active,
          COALESCE(SUM(CASE WHEN jobs.status IN ('Scheduled', 'In Progress') AND jobs.assigned_technician_id IS NULL THEN 1 ELSE 0 END), 0) AS unassigned,
          COALESCE(SUM(CASE WHEN jobs.status IN ('Completed', 'Invoiced') AND jobs.documentation_path IS NULL THEN 1 ELSE 0 END), 0) AS missing_docs
        FROM jobs
        INNER JOIN systems ON systems.id = jobs.system_id
        INNER JOIN sites ON sites.id = systems.site_id
        WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL AND sites.deleted_at IS NULL
          AND (jobs.status IN ('Scheduled', 'In Progress') OR (jobs.status IN ('Completed', 'Invoiced') AND jobs.documentation_path IS NULL))
      `),
      this.db.prepare(`SELECT COUNT(*) AS n FROM systems INNER JOIN sites ON sites.id = systems.site_id WHERE systems.deleted_at IS NULL AND sites.deleted_at IS NULL AND date(systems.next_due_date) < date('now')`),
      this.db.prepare(`SELECT COUNT(*) AS n FROM maintenance_requests INNER JOIN sites ON sites.id = maintenance_requests.site_id WHERE sites.deleted_at IS NULL AND maintenance_requests.status IN ('New', 'Reviewing')`),
      this.db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN defects.status = 'Open' THEN 1 ELSE 0 END), 0) AS open_defects,
          COALESCE(SUM(CASE WHEN defects.status = 'Open' AND defects.severity = 'Critical' THEN 1 ELSE 0 END), 0) AS critical_defects
        FROM defects
        INNER JOIN systems ON systems.id = defects.system_id
        INNER JOIN sites ON sites.id = systems.site_id
        WHERE defects.deleted_at IS NULL AND systems.deleted_at IS NULL AND sites.deleted_at IS NULL AND defects.status = 'Open'
      `),
      this.db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN certificates.status = 'Blocked' THEN 1 ELSE 0 END), 0) AS blocked_certs,
          COALESCE(SUM(CASE WHEN certificates.status = 'Valid' THEN 1 ELSE 0 END), 0) AS valid_certs
        FROM certificates
        INNER JOIN systems ON systems.id = certificates.system_id
        INNER JOIN sites ON sites.id = systems.site_id
        WHERE certificates.deleted_at IS NULL AND systems.deleted_at IS NULL AND sites.deleted_at IS NULL AND certificates.status IN ('Blocked', 'Valid')
      `)
    ]);

    const getCount = (result: unknown) => {
      const res = result as { results: { n: number }[] };
      return res?.results?.[0]?.n ?? 0;
    };

    const getMultiStat = (result: unknown) => {
      const res = result as { results: any[] };
      return res?.results?.[0] || {};
    };

    const jobs = getMultiStat(jobsStats);
    const defects = getMultiStat(defectsStats);
    const certs = getMultiStat(certificatesStats);

    return {
      activeJobs: Number(jobs.active ?? 0),
      unassignedJobs: Number(jobs.unassigned ?? 0),
      overdueSystems: getCount(cntOverdue),
      openRequests: getCount(cntRequests),
      missingDocuments: Number(jobs.missing_docs ?? 0),
      openDefects: Number(defects.open_defects ?? 0),
      criticalDefects: Number(defects.critical_defects ?? 0),
      blockedCertificates: Number(certs.blocked_certs ?? 0),
      validCertificates: Number(certs.valid_certs ?? 0)
    };
  }

  async getClientDashboardData(user: import("../access.js").AccessUser | null | undefined, today: string, soonDate: string): Promise<ClientDashboardData | null> {
    const sites = await clientSites(this.db, user);
    const siteIds = sites.map((s) => s.id);

    if (siteIds.length === 0) return null;

    const sp = inClause(siteIds);

    const [aggResult, quoteResult, requestResult] = await this.db.batch([
      // Per-site aggregate for heatmap + overall stats
      this.db.prepare(
        `SELECT sites.id, sites.owner_company_name,
                COUNT(DISTINCT s.id) AS system_count,
                COUNT(DISTINCT CASE WHEN date(s.next_due_date) < date(?) THEN s.id END) AS overdue_count,
                COUNT(DISTINCT CASE WHEN date(s.next_due_date) >= date(?) AND date(s.next_due_date) <= date(?) THEN s.id END) AS due_soon_count,
                COUNT(DISTINCT d.id) AS defect_count,
                COUNT(DISTINCT CASE WHEN d.severity IN ('Critical', 'Major') THEN d.id END) AS critical_count
          FROM sites
          LEFT JOIN systems s ON s.site_id = sites.id AND s.deleted_at IS NULL
          LEFT JOIN defects d ON d.system_id = s.id AND d.deleted_at IS NULL
            AND d.status IN ('Open', 'In Progress')
          WHERE sites.id IN (${sp}) AND sites.deleted_at IS NULL
          GROUP BY sites.id, sites.owner_company_name`
      ).bind(today, today, soonDate, ...siteIds),

      // Pending quotes
      this.db.prepare(
        `SELECT COUNT(*) AS pending_count,
                COALESCE(SUM(amount), 0) AS pending_amount
          FROM financial_records
          INNER JOIN sites ON sites.id = financial_records.site_id
          WHERE financial_records.site_id IN (${sp}) AND sites.deleted_at IS NULL
            AND financial_records.item_type = 'Quote' AND financial_records.payment_status = 'Pending Approval'`
      ).bind(...siteIds),

      // Open/In-progress service requests
      this.db.prepare(
        `SELECT COUNT(*) AS cnt
          FROM maintenance_requests
          INNER JOIN sites ON sites.id = maintenance_requests.site_id
          WHERE maintenance_requests.site_id IN (${sp}) AND sites.deleted_at IS NULL
            AND maintenance_requests.status NOT IN ('Closed', 'Resolved')`
      ).bind(...siteIds),
    ]);

    const qs = (quoteResult.results[0] ?? {}) as { pending_count?: number; pending_amount?: number };

    return {
      siteAggregates: (aggResult.results || []) as unknown as ClientSiteAggregate[],
      pendingQuoteCount: Number(qs.pending_count ?? 0),
      pendingQuoteAmount: Number(qs.pending_amount ?? 0),
      openRequestCount: Number((requestResult.results[0] as { cnt: number })?.cnt ?? 0)
    };
  }
}
