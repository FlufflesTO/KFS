## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Batching independent D1 queries
**Learning:** Sequential `.all()` and `.first()` Cloudflare D1 database calls dramatically increase TTFB due to accumulated network roundtrip latency in Astro dashboards.
**Action:** Use `await db.batch([...])` to combine independent read queries into a single network roundtrip, significantly accelerating initial page loads.
