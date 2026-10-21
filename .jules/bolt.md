## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-07-28 - Consolidating SQL Queries
**Learning:** Cloudflare D1 bills by rows read, so executing 9 separate \`COUNT(*)\` queries that scan the exact same tables (e.g. \`jobs\` JOIN \`systems\` JOIN \`sites\`) with slightly different \`WHERE\` conditions is an expensive anti-pattern.
**Action:** Replace independent \`COUNT(*)\` queries with a single query using conditional aggregation: \`COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)\`. Always include \`COALESCE\` as \`SUM()\` can return \`NULL\` on empty sets, breaking TypeScript \`Number\` assumptions.
