## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - D1 db.batch() instead of Promise.all()
**Learning:** When executing multiple independent database queries using Cloudflare D1, `Promise.all` triggers multiple parallel HTTP requests to the D1 API, leading to higher latency due to network round-trips.
**Action:** Use `db.batch([stmt1, stmt2, ...])` instead. This wraps the operations into a single HTTP round-trip transaction, drastically improving latency, while correctly returning an array of results that maps to the provided statements.
