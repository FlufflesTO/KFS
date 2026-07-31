## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-07-31 - Fixing N+1 Query in HR Admin Portal
**Learning:** Using `Promise.all()` to fire sequential `db.prepare()` queries inside a `.map()` loop causes severe latency spikes and N+1 query problems in serverless databases like Cloudflare D1.
**Action:** Replace `Promise.all()` query loops with batched data loading. Chunk arrays into sizes of 100 to avoid D1 bind limits, use `IN (...)` parameters, fetch records concurrently with `db.batch()`, and group results in-memory.
