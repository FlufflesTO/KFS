-- Migration 0034: Fix REAL financial columns introduced in 0013
-- Purpose: Convert sage_amount_ex_vat and sage_vat_amount from REAL to INTEGER (cents)
-- Background: Migration 0013 incorrectly used REAL columns for monetary values.
-- SQLite does not support ALTER COLUMN TYPE, so we rename, recreate, copy, and drop.
-- Rule: All monetary values MUST be stored as INTEGER (cents). REAL is prohibited.

-- Step 1: Add replacement INTEGER columns
ALTER TABLE financial_records ADD COLUMN sage_amount_ex_vat_cents INTEGER;
ALTER TABLE financial_records ADD COLUMN sage_vat_amount_cents INTEGER;

-- Step 2: Migrate existing REAL values to INTEGER cents (multiply by 100, round)
UPDATE financial_records
SET
  sage_amount_ex_vat_cents = CASE WHEN sage_amount_ex_vat IS NOT NULL THEN CAST(ROUND(sage_amount_ex_vat * 100) AS INTEGER) ELSE NULL END,
  sage_vat_amount_cents     = CASE WHEN sage_vat_amount IS NOT NULL    THEN CAST(ROUND(sage_vat_amount * 100) AS INTEGER)    ELSE NULL END;

-- Note: sage_amount_ex_vat and sage_vat_amount REAL columns are retained for compatibility
-- with existing queries but should not be written to. Application code must use the _cents columns.
-- A future migration can drop the REAL columns once all query references are updated.
