## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-08-15 - db.batch for independent queries
**Learning:** Cloudflare D1 db.batch can be used to combine independent sequential queries to minimize network latency.
**Action:** Replaced sequential await db.prepare().all() calls with a single db.batch() in the finance and compliance dashboards.
