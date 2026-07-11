## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Fixing N+1 Query in HR Admin
**Learning:** Sequential Cloudflare D1 database calls (like N+1 queries executing in `.map` with `Promise.all()`) drastically increase API latency due to the multiple HTTP roundtrips required for Serverless SQLite. Even when run in parallel, these roundtrips add significant overhead.
**Action:** When querying for relationships (like getting all files for a list of staff members), extract IDs, bundle them into a single `IN (...)` clause query using dynamic placeholders, chunk by 100 to avoid D1 limits, and use `db.batch()` to combine into a single request. Group the results in-memory.
