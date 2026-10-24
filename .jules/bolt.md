## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Optimized sequential COUNT queries in Dashboard Service
**Learning:** Cloudflare D1 incurs HTTP execution and VM overhead per statement in a batch. Sequential isolated counts on overlapping conditions scan tables redundantly.
**Action:** When gathering multiple counts on the same joined tables (e.g. active jobs vs missing docs), use single `SELECT` passes applying conditional aggregation (`SUM(CASE WHEN...)`) and wrap them in `COALESCE` to handle empty sets correctly.
