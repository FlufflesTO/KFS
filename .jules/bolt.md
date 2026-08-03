## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2023-10-27 - D1 N+1 Query Optimization in HR Admin
**Learning:** Resolving N+1 query problems in Cloudflare D1 requires utilizing an `IN (...)` clause and batching to overcome the 100 bind parameter limit. `Promise.all` mapping over individual database queries creates severe latency due to the roundtrip cost.
**Action:** Replace `Promise.all` with a single `db.batch` call that chunks IDs to respect parameter limits, fetches all related records, and maps them in-memory to prevent N+1 queries.
