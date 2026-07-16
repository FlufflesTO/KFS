## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2024-07-16 - D1 Batch Fetching for N+1 Queries
**Learning:** Cloudflare D1 has a strict limit of 100 bind parameters per query. When replacing `Promise.all` loops with single SQL `IN (...)` queries to avoid N+1 latency, passing an arbitrarily large array of IDs will crash if it exceeds 100 parameters.
**Action:** Always slice large input arrays into chunks of 100, generate separate prepared queries for each chunk, and execute them concurrently using `db.batch()`.
