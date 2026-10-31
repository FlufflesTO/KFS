## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2023-10-31 - Consolidate COUNT queries
**Learning:** When optimizing SQLite/Cloudflare D1 queries by consolidating multiple COUNT(*) calls on the same table, use conditional aggregation with COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0) to reduce redundant table scans and safely prevent NULL returns for empty result sets.
**Action:** Use conditional aggregation to group queries targeting identical record sets with exactly the same WHERE filters, taking care not to remove original WHERE clauses.
