import type { D1Database } from "@cloudflare/workers-types";
import type { DbSystem } from "@sentinel/types";

/**
 * SystemRepository
 * Abstraction layer for systems table with built-in soft delete (deleted_at IS NULL) filtering.
 */
export class SystemRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<DbSystem | null> {
    const system = await this.db
      .prepare(`SELECT * FROM systems WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(id)
      .first<DbSystem>();
    return system || null;
  }

  async findBySiteId(siteId: string): Promise<DbSystem[]> {
    const { results } = await this.db
      .prepare(`
        SELECT * FROM systems
        WHERE site_id = ?1 AND deleted_at IS NULL
        ORDER BY system_type ASC, coverage_area ASC
      `)
      .bind(siteId)
      .all<DbSystem>();
    return results || [];
  }

  async findAllActive(): Promise<DbSystem[]> {
    const { results } = await this.db
      .prepare(`
        SELECT * FROM systems
        WHERE deleted_at IS NULL
        ORDER BY system_type ASC, created_at DESC
      `)
      .all<DbSystem>();
    return results || [];
  }

  async create(system: Omit<DbSystem, 'created_at' | 'updated_at' | 'deleted_at'>): Promise<DbSystem> {
    const id = system.id || `sys-${crypto.randomUUID()}`;

    await this.db
      .prepare(`
        INSERT INTO systems (
          id, site_id, system_type, system_subtype, serial_number,
          installation_date, last_service_date, next_due_date,
          service_interval_months, coverage_area, notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
      `)
      .bind(
        id,
        system.site_id,
        system.system_type,
        system.system_subtype || null,
        system.serial_number || null,
        system.installation_date || null,
        system.last_service_date || null,
        system.next_due_date,
        system.service_interval_months,
        system.coverage_area,
        system.notes || null
      )
      .run();

    return this.findById(id) as Promise<DbSystem>;
  }

  async update(id: string, updates: Partial<DbSystem>): Promise<DbSystem | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.site_id !== undefined) {
      fields.push('site_id = ?');
      values.push(updates.site_id);
    }

    if (updates.system_type !== undefined) {
      fields.push('system_type = ?');
      values.push(updates.system_type);
    }

    if (updates.system_subtype !== undefined) {
      fields.push('system_subtype = ?');
      values.push(updates.system_subtype);
    }

    if (updates.serial_number !== undefined) {
      fields.push('serial_number = ?');
      values.push(updates.serial_number);
    }

    if (updates.installation_date !== undefined) {
      fields.push('installation_date = ?');
      values.push(updates.installation_date);
    }

    if (updates.last_service_date !== undefined) {
      fields.push('last_service_date = ?');
      values.push(updates.last_service_date);
    }

    if (updates.next_due_date !== undefined) {
      fields.push('next_due_date = ?');
      values.push(updates.next_due_date);
    }

    if (updates.service_interval_months !== undefined) {
      fields.push('service_interval_months = ?');
      values.push(updates.service_interval_months);
    }

    if (updates.coverage_area !== undefined) {
      fields.push('coverage_area = ?');
      values.push(updates.coverage_area);
    }

    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.db
      .prepare(`
        UPDATE systems
        SET ${fields.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `)
      .bind(...values)
      .run();

    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE systems
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
      `)
      .bind(id)
      .run();
  }

  async restore(id: string): Promise<DbSystem | null> {
    await this.db
      .prepare(`
        UPDATE systems
        SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
      `)
      .bind(id)
      .run();

    return this.findById(id);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(`SELECT 1 FROM systems WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(id)
      .first();
    return result !== null;
  }

  async countBySiteId(siteId: string): Promise<number> {
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM systems
        WHERE site_id = ?1 AND deleted_at IS NULL
      `)
      .bind(siteId)
      .first<{ count: number }>();
    return result?.count || 0;
  }
}
