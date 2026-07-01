## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-07-01 - Replacing Promise.all with db.batch for independent queries
**Learning:** Using `Promise.all` to execute multiple independent Cloudflare D1 `.all()` queries triggers multiple HTTP roundtrips to the D1 API, which negatively affects performance.
**Action:** Replaced `Promise.all` with `db.batch()` to combine multiple independent queries into a single HTTP roundtrip to D1, significantly reducing latency while maintaining the same result structure.
