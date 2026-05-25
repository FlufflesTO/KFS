-- Phase 21: Sage Manual Finance Integration
-- Add Sage reference fields to financial_records table

ALTER TABLE financial_records 
ADD COLUMN sage_reference TEXT;

ALTER TABLE financial_records 
ADD COLUMN sage_invoice_number TEXT;

ALTER TABLE financial_records 
ADD COLUMN sage_quote_number TEXT;

ALTER TABLE financial_records 
ADD COLUMN requires_sage_sync INTEGER NOT NULL DEFAULT 0 CHECK (requires_sage_sync IN (0, 1));

ALTER TABLE financial_records 
ADD COLUMN sage_sync_status TEXT DEFAULT 'Pending' CHECK (sage_sync_status IN ('Pending', 'Synced', 'Error', 'Manual Override'));

ALTER TABLE financial_records 
ADD COLUMN sage_synced_at TEXT;

ALTER TABLE financial_records 
ADD COLUMN finance_notes TEXT;

-- Create index for Sage sync operations
CREATE INDEX IF NOT EXISTS idx_financial_sage_sync ON financial_records(sage_sync_status, requires_sage_sync, distribution_date);

-- Create index for Sage reference lookups
CREATE INDEX IF NOT EXISTS idx_financial_sage_reference ON financial_records(sage_reference) WHERE sage_reference IS NOT NULL;

COMMENT: This migration adds Sage accounting integration fields to support manual finance workflows.
- sage_reference: General Sage reference number
- sage_invoice_number: Specific invoice number in Sage
- sage_quote_number: Specific quote number in Sage  
- requires_sage_sync: Flag indicating if record needs Sage synchronization
- sage_sync_status: Current sync state with Sage
- sage_synced_at: Timestamp of last successful Sage sync
- finance_notes: Internal finance team notes
