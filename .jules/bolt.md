## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-17 - Consolidating D1 API Queries using db.batch()
**Learning:** Using `Promise.all([db.prepare().all(), ...])` triggers multiple HTTP roundtrips to the D1 database, creating performance latency. While it executes the promises in parallel in Node/Workers, the Cloudflare D1 API still sees these as separate HTTP requests over the network.
**Action:** Replaced `Promise.all` with `db.batch([db.prepare(), ...])` in `getClientDashboardData` to consolidate all queries into a single HTTP roundtrip, significantly reducing the network overhead and database execution latency.
