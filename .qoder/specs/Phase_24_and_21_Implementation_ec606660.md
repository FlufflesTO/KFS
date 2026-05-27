# Phase 24 & Phase 21 Implementation

## Phase 24: Admin Pagination

The admin operations page (`src/pages/portal/admin/operations.astro`) and finance dashboard (`src/pages/portal/finance/dashboard.astro`) load data with hardcoded `LIMIT 80` in SSR frontmatter queries. We add URL-param-based pagination.

### Task 1: Admin Operations Pagination

**File:** `src/pages/portal/admin/operations.astro`

**Approach:** Read `?page=1&tab=jobs` from `Astro.url.searchParams`. Apply `LIMIT 50 OFFSET ((page-1)*50)` to the relevant query based on active tab. Add a total count query per tab. Render pagination controls (Previous/Next + page indicator) below each tab's content.

**Changes:**
- Parse `page` (default 1, max 999) and `tab` (default "jobs") from URL params
- Add `SELECT COUNT(*) FROM jobs` (and contacts) queries to get totals
- Replace `LIMIT 80` with `LIMIT 50 OFFSET ?` parameterized by page
- Add pagination nav HTML at bottom of each tab section:
  ```html
  <nav class="flex items-center justify-between mt-6 pt-4 border-t border-kharon-border">
    <a href="?tab=jobs&page=1" ...>Previous</a>
    <span>Page X of Y</span>
    <a href="?tab=jobs&page=3" ...>Next</a>
  </nav>
  ```
- Disable Previous on page 1, Next on last page

### Task 2: Finance Dashboard Pagination

**File:** `src/pages/portal/finance/dashboard.astro`

**Approach:** Same pattern — read `?page=1` from URL. Paginate main ledger query (currently `LIMIT 80`). Keep aggregate/aging queries unpaginated (they must always show full totals).

**Changes:**
- Parse `page` param (default 1)
- Add `SELECT COUNT(*) FROM financial_records` total query
- Replace `LIMIT 80` with `LIMIT 50 OFFSET ?`
- Keep aggregate query (totals + aging) unchanged (no pagination)
- Add pagination nav below the ledger table
- Keep "Invoice Required" queue unpaginated (already limited to 20)

### Task 3: Pagination Build Verification

- Run `npm run build` to confirm zero errors
- Verify both pages still render correctly

---

## Phase 21: Sage Manual Finance Control Register

The roadmap specifies a **manual** Sage workflow (no API integration). Kharon users manually record Sage references after performing actions in Sage externally.

### Task 4: Sage Fields Migration

**File to create:** `migrations/0013_sage_finance_fields.sql`

**Schema additions to `financial_records` table:**
```sql
ALTER TABLE financial_records ADD COLUMN sage_quote_number TEXT;
ALTER TABLE financial_records ADD COLUMN sage_invoice_number TEXT;
ALTER TABLE financial_records ADD COLUMN sage_customer_code TEXT;
ALTER TABLE financial_records ADD COLUMN sage_amount_ex_vat REAL;
ALTER TABLE financial_records ADD COLUMN sage_vat_amount REAL;
ALTER TABLE financial_records ADD COLUMN sage_payment_reference TEXT;
ALTER TABLE financial_records ADD COLUMN finance_task_status TEXT
  CHECK (finance_task_status IN (
    'Invoice Required', 'Quote Required', 'Sage Reference Missing',
    'Awaiting Payment', 'Complete'
  ));
```
Add index: `CREATE INDEX idx_finance_task_status ON financial_records(finance_task_status);`

Also update `schema.sql` with the new columns for documentation.

### Task 5: Update Submit-Jobcard Workflow

**File:** `src/pages/portal/api/submit-jobcard.js`

**Change:** When creating the financial record on jobcard closure, set `finance_task_status = 'Invoice Required'` instead of leaving it null. This feeds the finance task queue.

### Task 6: Finance Dashboard — Sage Fields & Task Queues

**File:** `src/pages/portal/finance/dashboard.astro`

**Changes:**
1. Add a **Task Queue section** above the ledger showing counts by `finance_task_status`:
   - "Invoice Required" (completed jobs needing Sage invoice)
   - "Sage Reference Missing" (invoiced but no sage_invoice_number)
   - "Awaiting Payment" (has Sage invoice, not yet settled)
   Each queue is a clickable filter that shows only matching records in the ledger.

2. Add Sage reference columns to the ledger table:
   - Sage Invoice # (editable inline or via modal)
   - Sage Customer Code
   - Amount ex VAT / VAT / Total

3. Add a "Record Sage Details" form/modal that updates Sage fields on a financial record and advances `finance_task_status`.

### Task 7: Sage Fields API Endpoint

**File to create:** `src/pages/portal/api/finance/sage-update.js`

**Purpose:** POST endpoint for finance users to update Sage reference fields on a financial record.

**Accepts:**
```json
{
  "record_id": "uuid",
  "sage_invoice_number": "INV-001",
  "sage_quote_number": "QTE-001",
  "sage_customer_code": "CUST01",
  "sage_amount_ex_vat": 1000.00,
  "sage_vat_amount": 150.00,
  "sage_payment_reference": "PAY-REF",
  "finance_task_status": "Awaiting Payment"
}
```

**Validation:** Record must exist, user must be finance/admin role, amounts must be non-negative. Logs audit event `finance.sage.update`.

### Task 8: Update Finance CSV Export

**File:** `src/pages/portal/api/finance/export.js`

**Change:** Add Sage columns to the export: `sage_invoice_number`, `sage_quote_number`, `sage_customer_code`, `sage_amount_ex_vat`, `sage_vat_amount`, `sage_payment_reference`, `finance_task_status`. Maintain formula-injection sanitization.

### Task 9: Build Verification

- Run `npm run build`
- Verify no errors across all modified files

---

## Execution Order

- Tasks 1-2 (Phase 24 pagination) are independent and can run in parallel
- Task 3 verifies Phase 24
- Task 4 (migration) must complete before Tasks 5-8
- Tasks 5, 7, 8 can run in parallel after Task 4
- Task 6 (dashboard UI) depends on Task 4 and Task 7 (needs the API endpoint to exist)
- Task 9 verifies Phase 21

## Implementation Notes

- All pagination uses SSR URL params (no client-side fetch) — consistent with existing architecture
- Sage workflow is entirely manual — no external API calls to Sage
- Finance task status tracks workflow progression without automation
- All new fields are nullable to avoid breaking existing records
