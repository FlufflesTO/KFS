## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Use db.batch for parallel execution over Cloudflare D1
**Learning:** Sequential await statements or Promise.all() for database querying in Cloudflare D1 incurs heavy network latencies as each query translates to a distinct HTTP request. D1 provides a batch() method designed to send multiple prepared statements within a single roundtrip to optimize overhead.
**Action:** When working with multiple unrelated SELECT or UPDATE queries to D1 in Cloudflare worker endpoints, always group them as an array of db.prepare().bind() calls and pass to db.batch() instead of resolving them through Promise.all().
