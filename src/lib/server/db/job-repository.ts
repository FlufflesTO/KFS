import type { D1Database } from "@cloudflare/workers-types";
import type { DbJob, DbLinkableJob } from "@sentinel/types";

/**
 * ConcurrencyError
 * Thrown when an update fails due to optimistic locking version mismatch.
 */
export class ConcurrencyError extends Error {
  constructor(
    public readonly entityId: string,
    public readonly expectedVersion: number,
    public readonly currentVersion: number
  ) {
    super(`Concurrency conflict on job ${entityId}: expected version ${expectedVersion}, but found ${currentVersion}`);
    this.name = "ConcurrencyError";
  }
}

/**
 * JobRepository
 * Abstraction layer for jobs table with built-in soft delete (deleted_at IS NULL) filtering
 * and optimistic locking for concurrency protection.
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

  /**
   * Update job status with optimistic locking.
   * Increments version atomically and throws ConcurrencyError if version mismatch.
   */
  async updateStatus(id: string, newStatus: string, expectedVersion: number): Promise<DbJob> {
    const updateStmt = `
      UPDATE jobs 
      SET status = ?1, version = version + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?2 AND version = ?3 AND deleted_at IS NULL
    `;

    const result = await this.db
      .prepare(updateStmt)
      .bind(newStatus, id, expectedVersion)
      .run();

    if (result.meta?.rows_written === 0) {
      // Fetch current version for error reporting
      const currentJob = await this.findById(id);
      if (!currentJob) {
        throw new Error(`Job ${id} not found`);
      }
      throw new ConcurrencyError(id, expectedVersion, currentJob.version ?? 0);
    }

    // Return updated job
    const updatedJob = await this.findById(id);
    if (!updatedJob) {
      throw new Error(`Job ${id} not found after update`);
    }
    return updatedJob;
  }

  /**
   * Generic update method with optimistic locking.
   * Allows updating multiple fields while protecting against concurrent modifications.
   */
  async update(
    id: string,
    updates: Partial<Pick<DbJob, "status" | "priority" | "assigned_technician_id" | "completed_date">>,
    expectedVersion: number
  ): Promise<DbJob> {
    const setClauses: string[] = [];
    const bindValues: (string | number | null)[] = [];

    if (updates.status !== undefined) {
      setClauses.push("status = ?");
      bindValues.push(updates.status);
    }
    if (updates.priority !== undefined) {
      setClauses.push("priority = ?");
      bindValues.push(updates.priority);
    }
    if (updates.assigned_technician_id !== undefined) {
      setClauses.push("assigned_technician_id = ?");
      bindValues.push(updates.assigned_technician_id);
    }
    if (updates.completed_date !== undefined) {
      setClauses.push("completed_date = ?");
      bindValues.push(updates.completed_date);
    }

    setClauses.push("version = version + 1", "updated_at = CURRENT_TIMESTAMP");
    bindValues.push(id, expectedVersion);

    const updateStmt = `
      UPDATE jobs 
      SET ${setClauses.join(", ")}
      WHERE id = ? AND version = ? AND deleted_at IS NULL
    `;

    const result = await this.db
      .prepare(updateStmt)
      .bind(...bindValues)
      .run();

    if (result.meta?.rows_written === 0) {
      const currentJob = await this.findById(id);
      if (!currentJob) {
        throw new Error(`Job ${id} not found`);
      }
      throw new ConcurrencyError(id, expectedVersion, currentJob.version ?? 0);
    }

    const updatedJob = await this.findById(id);
    if (!updatedJob) {
      throw new Error(`Job ${id} not found after update`);
    }
    return updatedJob;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .prepare(`UPDATE jobs SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?1`)
      .bind(id)
      .run();
  }
}
