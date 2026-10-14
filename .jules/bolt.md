## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Conditional Aggregation for Dashboard Stats
**Learning:** Cloudflare D1/SQLite performance degrades when performing multiple independent `COUNT(*)` queries on the same table. This causes redundant table scans.
**Action:** Consolidate independent `COUNT` queries into a single query using conditional aggregation with `COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)`. The `COALESCE` is critical because `SUM` returns `NULL` on empty sets, unlike `COUNT` which returns `0`.
