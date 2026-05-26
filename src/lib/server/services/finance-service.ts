import type { D1Database } from '@cloudflare/workers-types';
import { SageClient } from './sage-client.js';

/**
 * Finance Service Module
 * Purpose: Handle all finance-related operations with Sage-first approach
 * Implements the Sage-first model where portal tracks operational finance tasks,
 * not official accounting records which remain in Sage
 */

interface FinanceTask {
  id: string;
  siteId: string;
  jobId?: string;
  taskType: 'Quote Required' | 'Quote Issued in Sage' | 'Quote Approved' | 'Invoice Required' | 'Invoice Issued in Sage' | 'Payment Recorded in Sage' | 'Finance Follow-up';
  amount: number; // Amount in cents
  vatAmount?: number; // VAT in cents
  reference?: string;
  sageDocumentRef?: string; // Reference to Sage document (e.g. INV-001)
  sageDocumentId?: string; // Sage internal GUID
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class FinanceService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Create a finance task (operational task, not official invoice)
   */
  async createFinanceTask(task: Omit<FinanceTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceTask> {
    const id = `ft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.prepare(`
      INSERT INTO finance_tasks (
        id, site_id, job_id, task_type, amount, vat_amount, reference, 
        sage_document_ref, sage_document_id, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      id,
      task.siteId,
      task.jobId || null,
      task.taskType,
      task.amount,
      task.vatAmount || null,
      task.reference || null,
      task.sageDocumentRef || null,
      task.sageDocumentId || null,
      task.status,
      task.notes || null
    ).run();

    return {
      ...task,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as FinanceTask;
  }

  /**
   * Update a finance task status
   */
  async updateFinanceTask(id: string, updates: Partial<FinanceTask>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    if (updates.sageDocumentRef !== undefined) {
      fields.push('sage_document_ref = ?');
      values.push(updates.sageDocumentRef);
    }
    
    if (updates.sageDocumentId !== undefined) {
      fields.push('sage_document_id = ?');
      values.push(updates.sageDocumentId);
    }
    
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    
    if (fields.length === 0) return;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await this.db.prepare(`
      UPDATE finance_tasks 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).bind(...values).run();
  }

  /**
   * Get finance tasks by site
   */
  async getTasksBySite(siteId: string): Promise<FinanceTask[]> {
    const tasks = await this.db.prepare(`
      SELECT * FROM finance_tasks 
      WHERE site_id = ? 
      ORDER BY created_at DESC
    `).bind(siteId).all();
    
    return tasks.results as FinanceTask[];
  }

  /**
   * Get finance tasks by job
   */
  async getTasksByJob(jobId: string): Promise<FinanceTask[]> {
    const tasks = await this.db.prepare(`
      SELECT * FROM finance_tasks 
      WHERE job_id = ? 
      ORDER BY created_at DESC
    `).bind(jobId).all();
    
    return tasks.results as FinanceTask[];
  }

  /**
   * Get pending finance tasks
   */
  async getPendingTasks(): Promise<FinanceTask[]> {
    const tasks = await this.db.prepare(`
      SELECT * FROM finance_tasks 
      WHERE status = 'Pending'
      ORDER BY created_at ASC
    `).all();
    
    return tasks.results as FinanceTask[];
  }

  /**
   * Create quote required task
   */
  async createQuoteRequired(siteId: string, jobId?: string, amount: number, notes?: string): Promise<FinanceTask> {
    return this.createFinanceTask({
      siteId,
      jobId,
      taskType: 'Quote Required',
      amount,
      status: 'Pending',
      notes: notes || 'Quote required for job/service'
    });
  }

  /**
   * Create invoice required task
   */
  async createInvoiceRequired(siteId: string, jobId?: string, amount: number, notes?: string): Promise<FinanceTask> {
    return this.createFinanceTask({
      siteId,
      jobId,
      taskType: 'Invoice Required',
      amount,
      status: 'Pending',
      notes: notes || 'Invoice required to be issued in Sage'
    });
  }

  /**
   * Mark quote as issued in Sage
   */
  async markQuoteIssuedInSage(taskId: string, sageQuoteNumber: string): Promise<void> {
    await this.updateFinanceTask(taskId, {
      status: 'Completed',
      taskType: 'Quote Issued in Sage',
      sageDocumentRef: sageQuoteNumber
    });
  }

  /**
   * Mark quote as approved by client
   */
  async markQuoteApproved(taskId: string): Promise<void> {
    await this.createFinanceTask({
      siteId: (await this.getTaskById(taskId)).siteId,
      jobId: (await this.getTaskById(taskId)).jobId,
      taskType: 'Quote Approved',
      amount: (await this.getTaskById(taskId)).amount,
      status: 'Pending',
      notes: 'Client approved quote, invoice required in Sage'
    });
  }

  /**
   * Mark invoice as issued in Sage
   */
  async markInvoiceIssuedInSage(taskId: string, sageInvoiceNumber: string): Promise<void> {
    await this.updateFinanceTask(taskId, {
      status: 'Completed',
      taskType: 'Invoice Issued in Sage',
      sageDocumentRef: sageInvoiceNumber
    });
  }

  /**
   * Mark payment as recorded in Sage
   */
  async markPaymentRecordedInSage(taskId: string, sagePaymentRef: string): Promise<void> {
    await this.updateFinanceTask(taskId, {
      status: 'Completed',
      taskType: 'Payment Recorded in Sage',
      sageDocumentRef: sagePaymentRef
    });
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(taskId: string): Promise<FinanceTask> {
    const task = await this.db.prepare(`
      SELECT * FROM finance_tasks 
      WHERE id = ?
    `).bind(taskId).first();
    
    return task as FinanceTask;
  }

  /**
   * Get finance summary for dashboard
   */
  async getFinanceSummary(): Promise<{
    pendingTasks: number;
    totalPendingValue: number;
    overdueInvoices: number;
    unpaidAmount: number;
  }> {
    const result = await this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_tasks,
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending_value,
        COUNT(CASE WHEN task_type LIKE '%Invoice%' AND status = 'Pending' THEN 1 END) as overdue_invoices,
        SUM(CASE WHEN task_type LIKE '%Invoice%' AND status = 'Pending' THEN amount ELSE 0 END) as unpaid_amount
      FROM finance_tasks
    `).first();
    
    return {
      pendingTasks: parseInt(result.pending_tasks) || 0,
      totalPendingValue: parseInt(result.total_pending_value) || 0,
      overdueInvoices: parseInt(result.overdue_invoices) || 0,
      unpaidAmount: parseInt(result.unpaid_amount) || 0
    };
  }

  /**
   * Orchestrates pushing a task to Sage Accounting
   */
  async pushTaskToSage(taskId: string, env: Record<string, unknown>): Promise<void> {
    const task = await this.getTaskById(taskId);
    if (!task) throw new Error("Task not found");
    if (task.status === 'Completed' && task.sageDocumentId) {
      throw new Error("Task is already pushed to Sage.");
    }

    // Determine the type of document to push based on taskType
    const isQuote = task.taskType.includes('Quote');
    const isInvoice = task.taskType.includes('Invoice');

    if (!isQuote && !isInvoice) {
      throw new Error(`Cannot push task type '${task.taskType}' to Sage automatically.`);
    }

    // Retrieve client details
    const siteResult = await this.db.prepare(`SELECT owner_company_name FROM sites WHERE id = ?`).bind(task.siteId).first();
    if (!siteResult) throw new Error("Site not found");

    const clientName = siteResult.owner_company_name as string;
    const clientResult = await this.db.prepare(`SELECT * FROM clients WHERE company_name = ?`).bind(clientName).first();
    
    if (!clientResult) throw new Error(`Client record not found for company: ${clientName}`);

    const sageClient = new SageClient(this.db, env);
    let sageContactId = clientResult.sage_contact_id as string | undefined;

    // Resolve Contact ID
    if (!sageContactId) {
      // 1. Search Sage
      const existingContact = await sageClient.searchContacts(clientName);
      if (existingContact) {
        sageContactId = existingContact.id;
      } else {
        // 2. Create in Sage
        const newContact = await sageClient.createContact(clientName);
        sageContactId = newContact.id;
      }
      
      // 3. Cache Contact ID
      await this.db.prepare(`UPDATE clients SET sage_contact_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(sageContactId, clientResult.id).run();
    }

    // Prepare Document Description
    const description = `${isQuote ? 'Quote' : 'Invoice'} for Site Services (${task.taskType})`;
    
    // Create Document in Sage
    let document;
    if (isInvoice) {
      document = await sageClient.createSalesInvoice(sageContactId, description, task.amount, task.vatAmount || 0);
      await this.updateFinanceTask(taskId, {
        status: 'Completed',
        taskType: 'Invoice Issued in Sage',
        sageDocumentRef: document.displayed_as,
        sageDocumentId: document.id
      });
    } else {
      document = await sageClient.createSalesQuote(sageContactId, description, task.amount, task.vatAmount || 0);
      await this.updateFinanceTask(taskId, {
        status: 'Completed',
        taskType: 'Quote Issued in Sage',
        sageDocumentRef: document.displayed_as,
        sageDocumentId: document.id
      });
    }
  }
}