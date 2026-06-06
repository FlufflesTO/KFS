import type { D1Database } from "@cloudflare/workers-types";
import type { DbFinanceTask, DbFinanceSummary } from "@sentinel/types";

export class FinanceRepository {
  constructor(private db: D1Database) {}

  async create(task: Omit<DbFinanceTask, 'id' | 'created_at' | 'updated_at'>): Promise<DbFinanceTask> {
    const id = `ft-${crypto.randomUUID()}`;
    
    await this.db.prepare(`
      INSERT INTO finance_tasks (
        id, site_id, job_id, task_type, amount, vat_amount, reference, 
        sage_document_ref, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
      task.notes || null
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
    const fields = [];
    const values = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (updates.task_type !== undefined) {
      fields.push('task_type = ?');
      values.push(updates.task_type);
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

    // D1 returns integers as numbers - ensure strict integer typing
    return {
      pending_tasks: Number(result?.pending_tasks ?? 0) | 0,
      total_pending_value: Number(result?.total_pending_value ?? 0) | 0,
      overdue_invoices: Number(result?.overdue_invoices ?? 0) | 0,
      unpaid_amount: Number(result?.unpaid_amount ?? 0) | 0
    };
  }
}
