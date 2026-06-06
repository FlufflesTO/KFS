import type { D1Database } from "@cloudflare/workers-types";
import type { DbFinanceTask, DbFinanceSummary } from "@sentinel/types";

export class FinanceRepository {
  constructor(private db: D1Database) {}

  async create(task: Omit<DbFinanceTask, 'id' | 'created_at' | 'updated_at'>): Promise<DbFinanceTask> {
    const id = `ft-${crypto.randomUUID()}`;
    const completedAt = (task.status === 'Completed' || task.status === 'Cancelled') ? new Date().toISOString() : null;
    
    await this.db.prepare(`
      INSERT INTO finance_tasks (
        id, site_id, job_id, task_type, amount, vat_amount, reference, 
        sage_document_ref, status, notes, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    `).bind(
      id,
      task.site_id,
      task.job_id || null,
      task.task_type,
      task.amount,
      task.vat_amount || null,
      task.reference || null,
      task.sage_document_ref || null,
      task.status,
      task.notes || null,
      completedAt
    ).run();

    return this.findById(id) as Promise<DbFinanceTask>;
  }

  async findById(id: string): Promise<DbFinanceTask | null> {
    const task = await this.db.prepare(`
      SELECT * FROM finance_tasks WHERE id = ?
    `).bind(id).first<DbFinanceTask>();
    return task || null;
  }

  async findBySiteId(siteId: string): Promise<DbFinanceTask[]> {
    const { results } = await this.db.prepare(`
      SELECT * FROM finance_tasks WHERE site_id = ? ORDER BY created_at DESC
    `).bind(siteId).all<DbFinanceTask>();
    return results || [];
  }

  async findByJobId(jobId: string): Promise<DbFinanceTask[]> {
    const { results } = await this.db.prepare(`
      SELECT * FROM finance_tasks WHERE job_id = ? ORDER BY created_at DESC
    `).bind(jobId).all<DbFinanceTask>();
    return results || [];
  }

  async findPending(): Promise<DbFinanceTask[]> {
    const { results } = await this.db.prepare(`
      SELECT * FROM finance_tasks WHERE status = 'Pending' ORDER BY created_at ASC
    `).all<DbFinanceTask>();
    return results || [];
  }

  async update(id: string, updates: Partial<DbFinanceTask>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.task_type !== undefined) {
      fields.push('task_type = ?');
      values.push(updates.task_type);
    }

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
      
      fields.push('completed_at = ?');
      if (updates.status === 'Completed' || updates.status === 'Cancelled') {
        values.push(new Date().toISOString());
      } else {
        values.push(null);
      }
    }
    if (updates.completed_at !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completed_at);
    }
    if (updates.sage_document_ref !== undefined) {
      fields.push('sage_document_ref = ?');
      values.push(updates.sage_document_ref);
    }

    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.db.prepare(`
      UPDATE finance_tasks SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();
  }

  async getSummary(): Promise<DbFinanceSummary> {
    const result = await this.db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_tasks,
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending_value,
        COUNT(CASE WHEN task_type LIKE '%Invoice%' AND status = 'Pending' THEN 1 END) as overdue_invoices,
        SUM(CASE WHEN task_type LIKE '%Invoice%' AND status = 'Pending' THEN amount ELSE 0 END) as unpaid_amount
      FROM finance_tasks
    `).first<{
      pending_tasks: number;
      total_pending_value: number;
      overdue_invoices: number;
      unpaid_amount: number;
    }>();

    // D1 returns aggregates as numbers. Use Math.round rather than bitwise | 0:
    // bitwise OR truncates to a signed 32-bit integer, which wraps negative above ~R21.47m.
    return {
      pending_tasks: Math.round(Number(result?.pending_tasks ?? 0)),
      total_pending_value: Math.round(Number(result?.total_pending_value ?? 0)),
      overdue_invoices: Math.round(Number(result?.overdue_invoices ?? 0)),
      unpaid_amount: Math.round(Number(result?.unpaid_amount ?? 0))
    };
  }
}
