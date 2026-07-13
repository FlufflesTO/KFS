## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-07-13 - Avoiding N+1 Queries in Cloudflare D1
**Learning:** D1 has a strict limit of 100 bind parameters per query. When replacing N+1 queries with a batched query using an `IN (...)` clause, the input array must be chunked into sizes of 100 or less, and executed concurrently using `db.batch(queries)` to combine them into a single HTTP roundtrip.
**Action:** Use chunking and `db.batch` when querying large arrays of IDs in D1.
