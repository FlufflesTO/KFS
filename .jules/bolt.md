## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-06-28 - Optimize HR portal files query
**Learning:** Avoiding N+1 database queries inside mapping loops (e.g., `Promise.all(items.map(fetch))`) by using a single batch query and in-memory grouping significantly improves performance by reducing database round-trip latency on Cloudflare D1.
**Action:** Refactored `src/pages/portal/admin/hr.astro` to replace an N+1 query loop with a single `db.prepare(...).all()` call and an in-memory reduce to group `staff_files` by `staff_member_id`.
