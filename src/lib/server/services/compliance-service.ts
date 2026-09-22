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
    // ⚡ Bolt Optimization:
    // Consolidated multiple COUNT(*) queries into single conditional aggregations
    // to reduce redundant table scans and D1 load.
    const [defectsResult, certsResult] = await this.db.batch([
      this.db.prepare(`
        SELECT
          SUM(CASE WHEN status = 'Open' AND severity = 'Critical' THEN 1 ELSE 0 END) AS cntCritical,
          SUM(CASE WHEN status IN ('Open', 'In Progress') THEN 1 ELSE 0 END) AS cntOpen,
          SUM(CASE WHEN status IN ('Open', 'In Progress') AND updated_at < date('now', '-30 days') THEN 1 ELSE 0 END) AS cntStale,
          COUNT(DISTINCT CASE WHEN status IN ('Open', 'In Progress') AND severity = 'Critical' THEN system_id END) AS cntHighRisk
        FROM defects WHERE deleted_at IS NULL
      `),
      this.db.prepare(`
        SELECT
          SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) AS cntBlocked,
          SUM(CASE WHEN status = 'Valid' AND expiry_date IS NOT NULL AND expiry_date <= date('now', '+30 days') THEN 1 ELSE 0 END) AS cntExpiring
        FROM certificates WHERE deleted_at IS NULL
      `)
    ]);

    const getVal = (result: unknown, key: string) => {
      const res = result as { results: Record<string, number>[] };
      return res?.results?.[0]?.[key] ?? 0;
    };

    return {
      criticalDefects: getVal(defectsResult, 'cntCritical'),
      openDefects: getVal(defectsResult, 'cntOpen'),
      blockedCertificates: getVal(certsResult, 'cntBlocked'),
      staleDefects: getVal(defectsResult, 'cntStale'),
      expiringCertificates: getVal(certsResult, 'cntExpiring'),
      highRiskSystems: getVal(defectsResult, 'cntHighRisk')
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
