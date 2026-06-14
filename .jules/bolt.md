## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Cloudflare D1 Query Batching
**Learning:** Cloudflare D1 operates over HTTP. `Promise.all([db.prepare().all(), ...])` executes queries concurrently but triggers multiple independent HTTP roundtrips from the worker to the database.
**Action:** Use `db.batch([db.prepare(), ...])` instead, which consolidates all queries into a single HTTP roundtrip, significantly reducing database latency on complex dashboard loads.
