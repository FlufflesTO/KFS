/**
 * Project Sentinel - Compliance Service
 * Purpose: Provides business logic and aggregations for compliance status, defects, and certificates
 * Dependencies: @cloudflare/workers-types
 * Structural Role: Service Layer
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface ComplianceStats {
  criticalDefects: number;
  openDefects: number;
  blockedCertificates: number;
  staleDefects: number;
  expiringCertificates: number;
  highRiskSystems: number;
}

export interface DefectRecord {
  id: string;
  severity: string;
  sans_clause_ref: string;
  description: string;
  status: string;
  owner_company_name: string;
  system_type: string;
  coverage_area: string;
}

export interface CertificateRecord {
  id: string;
  certificate_type: string;
  issued_date: string;
  expiry_date: string | null;
  status: string;
  owner_company_name: string;
  system_type: string;
  coverage_area: string;
  blocking_defect_id: string | null;
  blocking_defect_description: string | null;
}

export class ComplianceService {
  constructor(private db: D1Database) {}

  async getAdminStats(): Promise<ComplianceStats> {
    const [
      defectsStats, certsStats, cntHighRisk
    ] = await this.db.batch([
      // Optimize: Combine defects stats into a single table scan
      this.db.prepare(`
        SELECT
          COUNT(*) AS openDefects,
          COALESCE(SUM(CASE WHEN status = 'Open' AND severity = 'Critical' THEN 1 ELSE 0 END), 0) AS criticalDefects,
          COALESCE(SUM(CASE WHEN updated_at < date('now', '-30 days') THEN 1 ELSE 0 END), 0) AS staleDefects
        FROM defects
        WHERE deleted_at IS NULL AND status IN ('Open', 'In Progress')
      `),
      // Optimize: Combine certificates stats into a single table scan
      this.db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END), 0) AS blockedCertificates,
          COALESCE(SUM(CASE WHEN status = 'Valid' AND expiry_date IS NOT NULL AND expiry_date <= date('now', '+30 days') THEN 1 ELSE 0 END), 0) AS expiringCertificates
        FROM certificates
        WHERE deleted_at IS NULL AND status IN ('Blocked', 'Valid')
      `),
      this.db.prepare(`SELECT COUNT(DISTINCT system_id) AS n FROM defects WHERE deleted_at IS NULL AND status IN ('Open', 'In Progress') AND severity = 'Critical'`)
    ]);

    const getCount = (result: unknown) => {
      const res = result as { results: { n: number }[] };
      return res?.results?.[0]?.n ?? 0;
    };

    const dStats = (defectsStats?.results?.[0] as { openDefects: number, criticalDefects: number, staleDefects: number } | undefined) ?? { openDefects: 0, criticalDefects: 0, staleDefects: 0 };
    const cStats = (certsStats?.results?.[0] as { blockedCertificates: number, expiringCertificates: number } | undefined) ?? { blockedCertificates: 0, expiringCertificates: 0 };

    return {
      criticalDefects: Number(dStats.criticalDefects),
      openDefects: Number(dStats.openDefects),
      blockedCertificates: Number(cStats.blockedCertificates),
      staleDefects: Number(dStats.staleDefects),
      expiringCertificates: Number(cStats.expiringCertificates),
      highRiskSystems: getCount(cntHighRisk)
    };
  }

  async getCriticalDefects(): Promise<DefectRecord[]> {
    const { results } = await this.db.prepare(`
      SELECT defects.id, defects.severity, defects.sans_clause_ref, defects.description, defects.status,
             sites.owner_company_name, systems.system_type, systems.coverage_area
      FROM defects
      INNER JOIN systems ON systems.id = defects.system_id
      INNER JOIN sites ON sites.id = systems.site_id
      WHERE defects.deleted_at IS NULL AND systems.deleted_at IS NULL AND sites.deleted_at IS NULL
        AND defects.severity IN ('Critical', 'Major') AND defects.status IN ('Open', 'In Progress')
      ORDER BY CASE defects.severity WHEN 'Critical' THEN 1 ELSE 2 END, defects.created_at ASC
      LIMIT 50
    `).all();
    return (results || []) as unknown as DefectRecord[];
  }

  async getBlockedCertificates(): Promise<CertificateRecord[]> {
    const { results } = await this.db.prepare(`
      SELECT certificates.id, certificates.certificate_type, certificates.issued_date, certificates.expiry_date, certificates.status,
             sites.owner_company_name, systems.system_type, systems.coverage_area,
             certificates.blocked_by_defect_id AS blocking_defect_id,
             blocking_defect.description AS blocking_defect_description
      FROM certificates
      INNER JOIN systems ON systems.id = certificates.system_id
      INNER JOIN sites ON sites.id = systems.site_id
      LEFT JOIN defects AS blocking_defect ON blocking_defect.id = certificates.blocked_by_defect_id AND blocking_defect.deleted_at IS NULL
      WHERE certificates.deleted_at IS NULL AND systems.deleted_at IS NULL AND sites.deleted_at IS NULL AND certificates.status = 'Blocked'
      ORDER BY certificates.issued_date DESC
      LIMIT 50
    `).all();
    return (results || []) as unknown as CertificateRecord[];
  }
}
