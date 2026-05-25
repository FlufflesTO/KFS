-- Phase 21: Sage Manual Finance Control Register
-- Adds Sage reference tracking fields and finance task workflow status

ALTER TABLE financial_records ADD COLUMN sage_quote_number TEXT;
ALTER TABLE financial_records ADD COLUMN sage_invoice_number TEXT;
ALTER TABLE financial_records ADD COLUMN sage_customer_code TEXT;
ALTER TABLE financial_records ADD COLUMN sage_amount_ex_vat REAL;
ALTER TABLE financial_records ADD COLUMN sage_vat_amount REAL;
ALTER TABLE financial_records ADD COLUMN sage_payment_reference TEXT;
ALTER TABLE financial_records ADD COLUMN finance_task_status TEXT
  CHECK (finance_task_status IN (
    'Invoice Required',
    'Quote Required',
    'Sage Reference Missing',
    'Awaiting Payment',
    'Complete'
  ));

CREATE INDEX IF NOT EXISTS idx_finance_task_status ON financial_records(finance_task_status);
CREATE INDEX IF NOT EXISTS idx_finance_sage_invoice ON financial_records(sage_invoice_number);
