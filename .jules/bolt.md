## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2024-05-24 - N+1 Queries in Cloudflare D1
**Learning:** Avoid N+1 queries when fetching related records in Cloudflare D1 by executing queries inside a Promise.all() loop. Use JSON aggregation (`json_group_array` combined with `json_object`) in the SQL query to fetch the parent and all children in a single database call, drastically reducing network roundtrips.
**Action:** Use JSON aggregation to fetch parent and children entities efficiently instead of using multiple `await db.prepare().all()` in `.map()` loops.
