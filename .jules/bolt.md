## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-06-01 - Avoid N+1 DB queries inside Promise.all
**Learning:** Resolving DB queries in a `Promise.all` `.map` loop creates severe N+1 latency problems in Cloudflare D1. Instead, batch DB queries using `db.batch()` or JSON aggregation and group them in-memory.
**Action:** Replaced `.map()` N+1 lookup inside `src/pages/portal/admin/hr.astro` with `listStaffMembersWithFiles` fetching related items batched in `src/lib/server/db/staff-repository.ts`.
