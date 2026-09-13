## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-09-13 - Cloudflare D1 JSON aggregation
**Learning:** In SQLite/Cloudflare D1, querying a parent entity along with its related children using multiple sequential queries (or inside a loop) creates a severe N+1 performance bottleneck. Using `json_group_array` with a conditional `json_object` inside a single `LEFT JOIN` query allows fetching everything in one database call, vastly reducing latency.
**Action:** Always use JSON aggregation (`json_group_array`) to fetch related entities in a 1-to-many relationship instead of doing separate loops of queries for each parent ID.
