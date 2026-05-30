-- Phase 21: expand manual Sage finance task statuses.
-- D1/SQLite cannot alter a CHECK constraint in place, so rebuild the table
-- while preserving existing rows and timestamps.

PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS trg_financial_records_updated_at;

CREATE TABLE financial_records_new (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  item_type TEXT NOT NULL CHECK (item_type IN ('Quote', 'Invoice', 'Payment')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending Approval', 'Unpaid', 'Settled')),
  distribution_date TEXT NOT NULL,
  reference TEXT,
  sage_quote_number TEXT,
  sage_invoice_number TEXT,
  sage_customer_code TEXT,
  sage_amount_ex_vat REAL,
  sage_vat_amount REAL,
  sage_payment_reference TEXT,
  finance_task_status TEXT CHECK (finance_task_status IN (
    'Finance Review Required',
    'Quote Required',
    'Sage Quote Created',
    'Sage Quote Sent',
    'Awaiting Client Approval',
    'Quote Approved',
    'Approved - Sage Invoice Required',
    'Invoice Required',
    'Sage Invoice Created',
    'Sage Invoice Sent',
    'Payment Pending in Sage',
    'Paid in Sage',
    'Sage Reference Missing',
    'Awaiting Payment',
    'Complete',
    'On Hold',
    'Cancelled',
    'No Charge',
    'Closed'
  )),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO financial_records_new (
  id, site_id, job_id, amount, item_type, payment_status, distribution_date, reference,
  sage_quote_number, sage_invoice_number, sage_customer_code, sage_amount_ex_vat,
  sage_vat_amount, sage_payment_reference, finance_task_status, created_at, updated_at
)
SELECT
  id, site_id, job_id, amount, item_type, payment_status, distribution_date, reference,
  sage_quote_number, sage_invoice_number, sage_customer_code, sage_amount_ex_vat,
  sage_vat_amount, sage_payment_reference, finance_task_status, created_at, updated_at
FROM financial_records;

DROP TABLE financial_records;
ALTER TABLE financial_records_new RENAME TO financial_records;

CREATE INDEX IF NOT EXISTS idx_financial_site_status ON financial_records(site_id, payment_status, distribution_date);
CREATE INDEX IF NOT EXISTS idx_financial_job ON financial_records(job_id);
CREATE INDEX IF NOT EXISTS idx_finance_task_status ON financial_records(finance_task_status);
CREATE INDEX IF NOT EXISTS idx_finance_sage_invoice ON financial_records(sage_invoice_number);

CREATE TRIGGER IF NOT EXISTS trg_financial_records_updated_at
AFTER UPDATE ON financial_records
FOR EACH ROW
BEGIN
  UPDATE financial_records SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

PRAGMA foreign_keys = ON;
