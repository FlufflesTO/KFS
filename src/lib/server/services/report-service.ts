/**
 * Project Sentinel - Report Service
 * Purpose: Provides data aggregation logic for the advanced reporting dashboard
 * Dependencies: @cloudflare/workers-types
 * Structural Role: Service Layer
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface AdvancedStats {
  completed_jobs: number;
  scheduled_jobs: number;
  in_progress_jobs: number;
  overdue_systems: number;
  open_defects: number;
  critical_defects: number;
  unpaid_invoices: number;
  unpaid_amount: number | null;
  active_users: number;
}

export interface TrendRow {
  month: string;
  completed: number;
  scheduled: number;
  in_progress: number;
}

export interface TechnicianRow {
  name: string;
  completed_jobs: number;
}

export interface SystemTypeRow {
  system_type: string;
  count: number;
}

export interface FinanceRow {
  reference: string;
  amount: number;
  owner_company_name: string;
  distribution_date: string;
  payment_status: string;
}

export interface FullReportingData {
  stats: AdvancedStats | null;
  monthlyTrends: TrendRow[];
  topTechs: TechnicianRow[];
  systemTypes: SystemTypeRow[];
  outstandingFinance: FinanceRow[];
}

export class ReportService {
  constructor(private db: D1Database) {}

  async getFullReport(): Promise<FullReportingData> {
    const [statsResult, trendsResult, techsResult, typesResult, financeResult] = await this.db.batch([
      this.db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL AND status = 'Completed') AS completed_jobs,
          (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL AND status = 'Scheduled') AS scheduled_jobs,
          (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL AND status = 'In Progress') AS in_progress_jobs,
          (SELECT COUNT(*) FROM systems WHERE deleted_at IS NULL AND date(next_due_date) < date('now')) AS overdue_systems,
          (SELECT COUNT(*) FROM defects WHERE deleted_at IS NULL AND status = 'Open') AS open_defects,
          (SELECT COUNT(*) FROM defects WHERE deleted_at IS NULL AND status = 'Open' AND severity = 'Critical') AS critical_defects,
          (SELECT COUNT(*) FROM financial_records WHERE payment_status = 'Unpaid') AS unpaid_invoices,
          (SELECT COALESCE(SUM(amount), 0) / 100.0 FROM financial_records WHERE payment_status = 'Unpaid') AS unpaid_amount,
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS active_users
      `),
      this.db.prepare(`
        SELECT
          strftime('%Y-%m', created_at) AS month,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS completed,
          COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) AS scheduled,
          COUNT(CASE WHEN status = 'In Progress' THEN 1 END) AS in_progress
        FROM jobs
        WHERE deleted_at IS NULL AND created_at >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month
      `),
      this.db.prepare(`
        SELECT
          users.name,
          COUNT(jobs.id) AS completed_jobs
        FROM users
        LEFT JOIN jobs
          ON users.id = jobs.assigned_technician_id
         AND jobs.deleted_at IS NULL
         AND jobs.status = 'Completed'
        WHERE users.role = 'tech'
          AND users.deleted_at IS NULL
        GROUP BY users.id, users.name
        ORDER BY completed_jobs DESC, users.name ASC
        LIMIT 5
      `),
      this.db.prepare(`
        SELECT
          system_type,
          COUNT(*) AS count
        FROM systems
        WHERE deleted_at IS NULL
        GROUP BY system_type
        ORDER BY count DESC, system_type ASC
        LIMIT 8
      `),
      this.db.prepare(`
        SELECT
          financial_records.reference,
          financial_records.amount / 100.0 AS amount,
          sites.owner_company_name,
          financial_records.distribution_date,
          financial_records.payment_status
        FROM financial_records
        INNER JOIN sites ON sites.id = financial_records.site_id
        WHERE financial_records.payment_status = 'Unpaid' AND sites.deleted_at IS NULL
        ORDER BY financial_records.distribution_date DESC
        LIMIT 10
      `)
    ]);

    return {
      stats: (statsResult.results[0] as unknown as AdvancedStats) || null,
      monthlyTrends: (trendsResult.results || []) as unknown as TrendRow[],
      topTechs: (techsResult.results || []) as unknown as TechnicianRow[],
      systemTypes: (typesResult.results || []) as unknown as SystemTypeRow[],
      outstandingFinance: (financeResult.results || []) as unknown as FinanceRow[]
    };
  }
}
