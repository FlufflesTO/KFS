## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-08-21 - Refactoring sequential DB queries to db.batch
**Learning:** The dashboard made 8 independent, sequential database queries to load the page, causing significant N+1 network latency. Cloudflare D1 supports batched execution.
**Action:** Refactored multiple sequential db.prepare() queries into a single db.batch() call to significantly reduce network roundtrips.
