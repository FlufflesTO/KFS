## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Cloudflare D1 N+1 Query Resolution
**Learning:** Executing queries inside a loop or `Promise.all()` (e.g. for fetching relations like staff files) causes severe latency in Cloudflare D1 due to individual HTTP roundtrips. Moreover, D1 has a strict limit of 100 bind parameters per query.
**Action:** Resolve N+1 queries by fetching all related records in a single batched query using an `IN (...)` clause. Chunk the IDs into batches of 100 or fewer to avoid parameter limits, execute them concurrently using `db.batch()`, and group the results in-memory.
