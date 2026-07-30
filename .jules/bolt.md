## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-07-30 - Batched DB queries to avoid N+1
**Learning:** Avoid N+1 queries by fetching all related records in a single batched query using an IN (...) clause with dynamic placeholders, slicing large input arrays to handle D1's 100-parameter limit, and grouping the results in-memory.
**Action:** Replaced Promise.all(members.map(...listStaffFiles)) with listStaffFilesForMembers batched query.
