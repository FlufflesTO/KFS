## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-06-29 - Use db.batch for multiple D1 queries
**Learning:** Using `Promise.all` to execute multiple queries against Cloudflare D1 parallelizes them in Node/V8 but still triggers multiple individual HTTP roundtrips to the D1 API endpoint, which is a major performance bottleneck in serverless edge environments.
**Action:** Always refactor independent sequential or `Promise.all` query execution into `db.batch([db.prepare(...), ...])`. This consolidates the requests into a single HTTP roundtrip, significantly reducing latency and execution time.
