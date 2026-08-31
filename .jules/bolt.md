## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2024-05-30 - Cloudflare D1 N+1 Queries with Promise.all
**Learning:** Do not execute individual database queries inside Promise.all() and .map() loops to fetch related records in Cloudflare D1 backend code, as it causes severe N+1 query performance penalties.
**Action:** Fetch all necessary related records in a single bulk query and group them by their parent ID in-memory.
