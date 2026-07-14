## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-07-14 - Fix N+1 Query in HR Portal
**Learning:** In Astro endpoints/pages, performing queries inside a .map() loop combined with Promise.all() causes severe N+1 latency issues with Cloudflare D1. Even though they run concurrently, each query requires a separate HTTP roundtrip.
**Action:** When fetching related data for lists (like staff files for staff members), always fetch all related records in a single batched query using an `IN (...)` clause with dynamic placeholders (`.bind(...params)`) and group the results in-memory.
