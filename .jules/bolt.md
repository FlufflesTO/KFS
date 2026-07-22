## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-07-22 - Eliminating N+1 query in Admin HR Astro component
**Learning:** Astro pages frequently iterate through data arrays using `Promise.all(...` fetching queries for each item which leads to N+1 query performance bottlenecks, especially in Cloudflare D1 environment.
**Action:** Use batched queries chunked appropriately (`IN (...)`) to fetch all related elements simultaneously, and group them in-memory using a `Map`.
