## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Batching N+1 Queries in Astro Server Routes
**Learning:** Resolving N+1 queries in server routes using `Promise.all(arr.map(...))` by utilizing SQLite's `IN (...)` clause and `db.batch()` avoids the massive latency associated with making hundreds of individual database roundtrips for Cloudflare D1.
**Action:** Replace `Promise.all` + loop mapping with a single (or chunked) batched SQL query using an `IN (...)` clause and reconstructing the objects in-memory with a Map or Dictionary. Be mindful of SQLite parameter limits (default 100 on Cloudflare D1) by chunking the parameter arrays and using `db.batch()`.
