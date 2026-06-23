## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Use db.batch instead of Promise.all for D1 parallel queries
**Learning:** `Promise.all` with multiple `db.prepare().all()` requests triggers multiple independent HTTP roundtrips to the Cloudflare D1 API.
**Action:** Always use `db.batch([db.prepare(), ...])` instead to consolidate all query execution into a single HTTP request, significantly reducing latency.
