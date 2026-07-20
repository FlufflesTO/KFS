## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2024-05-18 - Eliminating N+1 queries in Cloudflare D1 with db.batch()
**Learning:** Cloudflare D1 has a strict limit of 100 bind parameters per query. When optimizing N+1 queries by replacing iterative loop queries with a single batched fetch, we cannot just use a massive `IN (...)` clause. Furthermore, using `Promise.all([db.prepare().all(), ...])` for parallel queries triggers multiple HTTP roundtrips.
**Action:** When fetching large sets of related records, slice the ID array into chunks of 100 or fewer. Construct separate `IN (...)` queries for each chunk, then execute them concurrently using `db.batch([db.prepare(), ...])`. This approach stays within bind limits while consolidating all execution into a single, high-performance HTTP roundtrip to the D1 API.
