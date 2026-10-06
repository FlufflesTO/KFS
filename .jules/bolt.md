## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-11 - Optimize Admin Stats queries
**Learning:** Cloudflare D1 batching of numerous `COUNT(*)` queries can result in N+1 table scans when the queries share common root tables and base filters.
**Action:** Grouped independent `COUNT(*)` queries on the same tables using conditional aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) and wrapped them in `COALESCE` to return `0` instead of `null` safely. Kept solitary queries as simple `COUNT(*)` to maintain efficient filtering and index use.
