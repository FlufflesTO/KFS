import type { D1Database } from "@cloudflare/workers-types";
import type { DbDefect, DefectSeverity, DefectStatus } from "@sentinel/types";

export interface CreateDefectInput {
  id?: string;
  system_id: string;
  job_id: string | null;
  severity: DefectSeverity;
  sans_clause_ref: string | null;
  description: string;
  certificate_blocking: number;
  status: DefectStatus;
}

export interface UpdateDefectInput {
  severity?: DefectSeverity;
  sans_clause_ref?: string | null;
  description?: string;
  certificate_blocking?: number;
  status?: DefectStatus;
  remediation_notes?: string | null;
}

export interface DefectWithSystemInfo extends DbDefect {
  system_type: string;
  coverage_area: string;
  site_id: string;
  owner_company_name: string;
}

/**
 * DefectRepository
 * Abstraction layer for defects table with built-in soft delete (deleted_at IS NULL) filtering.
 * Includes certificate blocking helper methods.
 */
export class DefectRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<DbDefect | null> {
    const defect = await this.db
      .prepare(`SELECT * FROM defects WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(id)
      .first<DbDefect>();
    return defect || null;
  }

  async findByIdWithSystemInfo(id: string): Promise<DefectWithSystemInfo | null> {
    const defect = await this.db
      .prepare(`
        SELECT d.*, s.system_type, s.coverage_area, s.site_id, site.owner_company_name
        FROM defects d
        INNER JOIN systems s ON s.id = d.system_id
        INNER JOIN sites site ON site.id = s.site_id
        WHERE d.id = ?1 AND d.deleted_at IS NULL AND s.deleted_at IS NULL AND site.deleted_at IS NULL
        LIMIT 1
      `)
      .bind(id)
      .first<DefectWithSystemInfo>();
    return defect || null;
  }

  async findBySystemId(systemId: string): Promise<DbDefect[]> {
    const { results } = await this.db
      .prepare(`
        SELECT * FROM defects
        WHERE system_id = ?1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `)
      .bind(systemId)
      .all<DbDefect>();
    return results || [];
  }

  async findByJobId(jobId: string): Promise<DbDefect[]> {
    const { results } = await this.db
      .prepare(`
        SELECT * FROM defects
        WHERE job_id = ?1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `)
      .bind(jobId)
      .all<DbDefect>();
    return results || [];
  }

  async findOpenBlockingDefects(systemId: string): Promise<DbDefect[]> {
    const { results } = await this.db
      .prepare(`
        SELECT * FROM defects
        WHERE system_id = ?1
          AND deleted_at IS NULL
          AND certificate_blocking = 1
          AND status IN ('Open', 'In Progress')
        ORDER BY severity DESC, created_at ASC
      `)
      .bind(systemId)
      .all<DbDefect>();
    return results || [];
  }

  async findByStatus(status: DefectStatus): Promise<DbDefect[]> {
    const { results } = await this.db
      .prepare(`
        SELECT * FROM defects
        WHERE status = ?1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `)
      .bind(status)
      .all<DbDefect>();
    return results || [];
  }

  async findBySeverity(severity: DefectSeverity): Promise<DbDefect[]> {
    const { results } = await this.db
      .prepare(`
        SELECT * FROM defects
        WHERE severity = ?1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `)
      .bind(severity)
      .all<DbDefect>();
    return results || [];
  }

  async findAllActive(): Promise<DefectWithSystemInfo[]> {
    const { results } = await this.db
      .prepare(`
        SELECT d.*, s.system_type, s.coverage_area, s.site_id, site.owner_company_name
        FROM defects d
        INNER JOIN systems s ON s.id = d.system_id
        INNER JOIN sites site ON site.id = s.site_id
        WHERE d.deleted_at IS NULL AND s.deleted_at IS NULL AND site.deleted_at IS NULL
        ORDER BY d.created_at DESC
      `)
      .all<DefectWithSystemInfo>();
    return results || [];
  }

  async create(defect: CreateDefectInput): Promise<DbDefect> {
    const id = defect.id || `def-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    await this.db
      .prepare(`
        INSERT INTO defects (
          id, system_id, job_id, severity, sans_clause_ref,
          description, certificate_blocking, status
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      `)
      .bind(
        id,
        defect.system_id,
        defect.job_id,
        defect.severity,
        defect.sans_clause_ref,
        defect.description,
        defect.certificate_blocking,
        defect.status
      )
      .run();

    return this.findById(id) as Promise<DbDefect>;
  }

  async update(id: string, updates: UpdateDefectInput): Promise<DbDefect | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.severity !== undefined) {
      fields.push('severity = ?');
      values.push(updates.severity);
    }

    if (updates.sans_clause_ref !== undefined) {
      fields.push('sans_clause_ref = ?');
      values.push(updates.sans_clause_ref);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }

    if (updates.certificate_blocking !== undefined) {
      fields.push('certificate_blocking = ?');
      values.push(updates.certificate_blocking);
    }

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (updates.remediation_notes !== undefined) {
      fields.push('remediation_notes = ?');
      values.push(updates.remediation_notes);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.db
      .prepare(`
        UPDATE defects
        SET ${fields.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `)
      .bind(...values)
      .run();

    return this.findById(id);
  }

  async resolve(id: string, remediationNotes?: string | null): Promise<DbDefect | null> {
    await this.db
      .prepare(`
        UPDATE defects
        SET status = 'Resolved', remediation_notes = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2 AND deleted_at IS NULL
      `)
      .bind(remediationNotes || null, id)
      .run();

    return this.findById(id);
  }

  async close(id: string, remediationNotes?: string | null): Promise<DbDefect | null> {
    await this.db
      .prepare(`
        UPDATE defects
        SET status = 'Closed', remediation_notes = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2 AND deleted_at IS NULL
      `)
      .bind(remediationNotes || null, id)
      .run();

    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE defects
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
      `)
      .bind(id)
      .run();
  }

  async restore(id: string): Promise<DbDefect | null> {
    await this.db
      .prepare(`
        UPDATE defects
        SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
      `)
      .bind(id)
      .run();

    return this.findById(id);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(`SELECT 1 FROM defects WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(id)
      .first();
    return result !== null;
  }

  async countBySystemId(systemId: string): Promise<number> {
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM defects
        WHERE system_id = ?1 AND deleted_at IS NULL
      `)
      .bind(systemId)
      .first<{ count: number }>();
    return result?.count || 0;
  }

  async countByStatus(status: DefectStatus): Promise<number> {
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM defects
        WHERE status = ?1 AND deleted_at IS NULL
      `)
      .bind(status)
      .first<{ count: number }>();
    return result?.count || 0;
  }

  /**
   * Auto-block valid certificates when a certificate-blocking defect becomes active.
   * Records the defect as the blocker on affected certificates.
   */
  async blockCertificates(defectId: string, systemId: string): Promise<number> {
    const before = await this.db
      .prepare(`
        SELECT COUNT(*) as n
        FROM certificates
        WHERE system_id = ?1 AND status = 'Valid' AND deleted_at IS NULL
      `)
      .bind(systemId)
      .first<{ n: number }>();

    const count = before?.n || 0;

    if (count > 0) {
      await this.db
        .prepare(`
          UPDATE certificates
          SET status = 'Blocked', blocked_by_defect_id = ?1
          WHERE system_id = ?2 AND status = 'Valid' AND deleted_at IS NULL
        `)
        .bind(defectId, systemId)
        .run();
    }

    return count;
  }

  /**
   * Restore blocked certificates to Valid status if no other blocking defects remain.
   * Returns true if certificates were restored.
   */
  async maybeRestoreCertificates(systemId: string, excludeDefectId: string): Promise<boolean> {
    const remainingBlocker = await this.db
      .prepare(`
        SELECT id FROM defects
        WHERE system_id = ?1
          AND deleted_at IS NULL
          AND certificate_blocking = 1
          AND status IN ('Open', 'In Progress')
          AND id != ?2
        LIMIT 1
      `)
      .bind(systemId, excludeDefectId)
      .first();

    if (!remainingBlocker) {
      await this.db
        .prepare(`
          UPDATE certificates
          SET status = 'Valid', blocked_by_defect_id = NULL
          WHERE system_id = ?1 AND status = 'Blocked' AND deleted_at IS NULL
        `)
        .bind(systemId)
        .run();
      return true;
    }

    return false;
  }
}
