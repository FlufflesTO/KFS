## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Resolving N+1 Database queries using db.batch in Cloudflare D1
**Learning:** Cloudflare D1 has a strict limit of 100 bind parameters per query. When replacing N+1 `Promise.all` database calls with a single IN clause, the parameters limit can easily be exceeded for large datasets.
**Action:** When refactoring N+1 queries using `IN (...)`, always chunk the identifiers array into batches of <= 100 parameters, map each chunk into a prepared statement, and execute them simultaneously using `db.batch(queries)` to safely and performantly consolidate the requests into a single HTTP roundtrip.
