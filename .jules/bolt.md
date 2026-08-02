## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Admin Import Pre-fetching
**Learning:** Cloudflare D1 `db.batch()` treats all queued statements as a single transaction. When optimizing N+1 query patterns (like CSV imports that insert/update many records), avoid batching DML statements (`INSERT`/`UPDATE`) if you want to preserve partial success semantics (where one failed row does not abort the whole import).
**Action:** Optimize N+1 issues in bulk operations by pre-fetching lookup data in chunked batched `SELECT` queries (e.g., using `IN (?)`), caching the results in a `Set` or `Map`, and executing individual `INSERT`/`UPDATE` operations inside the loop to preserve transactional isolation and partial success functionality.
