-- Phase 19: Finance Accounting and VAT Hardening
-- Adds remaining Sage reference fields, finance notes, and credit-note tracking.

ALTER TABLE financial_records ADD COLUMN sage_amount_inc_vat REAL;
ALTER TABLE financial_records ADD COLUMN sage_document_date TEXT;
ALTER TABLE financial_records ADD COLUMN sage_due_date TEXT;
ALTER TABLE financial_records ADD COLUMN finance_notes TEXT CHECK (finance_notes IS NULL OR length(trim(finance_notes)) <= 3000);
ALTER TABLE financial_records ADD COLUMN no_charge_reason TEXT CHECK (no_charge_reason IS NULL OR length(trim(no_charge_reason)) <= 500);
ALTER TABLE financial_records ADD COLUMN on_hold_reason TEXT CHECK (on_hold_reason IS NULL OR length(trim(on_hold_reason)) <= 500);
ALTER TABLE financial_records ADD COLUMN credit_note_for_id TEXT REFERENCES financial_records(id) ON DELETE SET NULL;
ALTER TABLE financial_records ADD COLUMN item_subtype TEXT CHECK (item_subtype IS NULL OR item_subtype IN ('Credit Note'));

CREATE INDEX IF NOT EXISTS idx_finance_credit_note_for ON financial_records(credit_note_for_id);
CREATE INDEX IF NOT EXISTS idx_finance_due_date ON financial_records(sage_due_date);
