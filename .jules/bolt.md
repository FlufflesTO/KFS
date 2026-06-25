## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2024-05-24 - Database Query Optimization: db.batch() and Avoid N+1 In-Memory Grouping
**Learning:** In Cloudflare D1, `Promise.all([db.prepare().all(), ...])` triggers multiple HTTP roundtrips to the D1 API, which increases latency. Additionally, executing individual queries in a loop (N+1 query problem) exacerbates this.
**Action:** Always use `db.batch([db.prepare(), ...])` for parallel queries to combine them into a single roundtrip. To fix N+1 queries, fetch all related records in a single batch using an `IN` clause and group the results in-memory.
