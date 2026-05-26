-- Phase 21: Finance Tasks (Sage Alignment)
CREATE TABLE finance_tasks (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('Quote Required', 'Quote Issued in Sage', 'Quote Approved', 'Invoice Required', 'Invoice Issued in Sage', 'Payment Recorded in Sage', 'Finance Follow-up')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  vat_amount NUMERIC CHECK (vat_amount >= 0),
  reference TEXT,
  sage_document_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_finance_tasks_site ON finance_tasks(site_id);
CREATE INDEX IF NOT EXISTS idx_finance_tasks_job ON finance_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_finance_tasks_status ON finance_tasks(status);

CREATE TRIGGER IF NOT EXISTS trg_finance_tasks_updated_at
AFTER UPDATE ON finance_tasks
FOR EACH ROW
BEGIN
  UPDATE finance_tasks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
