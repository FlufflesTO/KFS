## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-08-18 - Added indexes for dashboard queries
**Learning:** Missing indexes on 'deleted_at' and 'status' across multiple domain tables (systems, sites, jobs, defects, certificates) caused sequential unindexed scans during analytical dashboard queries.
**Action:** Added composite and single-column indexes on these fields in schema.sql.
