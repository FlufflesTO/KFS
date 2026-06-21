## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-06-21 - Optimize Client Dashboard Queries
**Learning:** Using Promise.all with db.prepare().all() for Cloudflare D1 triggers multiple HTTP roundtrips. db.batch() bundles them into a single roundtrip.
**Action:** Use db.batch for parallel execution of independent queries to minimize D1 API latency.
