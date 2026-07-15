## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Resolve N+1 Query in HR Admin Page
**Learning:** Resolving N+1 queries in D1 requires replacing `Promise.all` inside loops with a single query using an `IN (...)` clause. When batch fetching large arrays in Cloudflare D1, it's essential to slice the input into chunks (e.g. 100) and use `db.batch()` to execute the queries concurrently while respecting parameter limits.
**Action:** Replaced `.map()` and `Promise.all` for fetching staff files with a new `listStaffFilesByMemberIds` function that chunks input arrays and uses `db.batch()`.
