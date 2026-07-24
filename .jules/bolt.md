## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-12 - D1 Batch Limits for N+1 Query Resolution
**Learning:** Cloudflare D1 has a strict limit of 100 bind parameters per query. When attempting to resolve N+1 queries using an `IN (...)` clause, passing large arrays will cause parameter limit errors.
**Action:** When constructing `IN (...)` clauses for large arrays, slice the input array into chunks of 100 or fewer, prepare separate queries for each chunk, and execute them concurrently using `db.batch(queries)` to maintain batched performance while avoiding parameter limit errors.
