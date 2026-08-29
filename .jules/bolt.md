## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Batch database queries in advanced reporting
**Learning:** When a page loads and requires multiple independent read queries from D1 database, running them sequentially incurs unnecessary network roundtrips. Batching independent queries significantly reduces backend response latency and avoids an N+1 fetching pattern.
**Action:** Replaced sequential await db.prepare(...).all() with await db.batch([...]) in src/pages/portal/admin/advanced-reporting.astro.
