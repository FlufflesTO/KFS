## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-09 - N+1 Query Prevention in Astro SSR
**Learning:** Performing database queries inside loop maps using `Promise.all` triggers an N+1 query bottleneck against the Cloudflare D1 API, leading to extreme request amplification and network overhead.
**Action:** Consolidate related records using a single `db.batch` call to fetch all records simultaneously, then apply in-memory grouping (e.g. `O(n)` using a `Map`) to dramatically lower initial server load time and network trips.