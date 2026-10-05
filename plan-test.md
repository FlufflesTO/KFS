1. **Optimize Database Queries in `getDashboardStats`**
   - I will use the `replace_with_git_merge_diff` tool to update the `getDashboardStats` function in `src/lib/server/db-optimization.ts`. The current implementation executes 9 separate `COUNT(*)` queries using `db.batch()`. Many of these queries scan the same tables (e.g., `jobs`, `defects`, `certificates`).
   - I will consolidate the redundant queries for the `jobs`, `defects`, and `certificates` tables by replacing multiple `COUNT(*)` calls with a single query per table using conditional aggregation (e.g., `COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)`).
   - I will preserve the base `WHERE` clauses for these queries (e.g., `deleted_at IS NULL AND status IN (...)`) to ensure the queries remain index-friendly and avoid full table scans.
   - This optimization reduces the number of queries inside the batch from 9 down to 5, minimizing database engine overhead and redundant table scans.

2. **Verify changes to `src/lib/server/db-optimization.ts`**
   - Use `run_in_bash_session` with `git diff` to verify the patch to `src/lib/server/db-optimization.ts` was applied successfully.

3. **Run format and lint checks, and the test suite**
   - I will use the `run_in_bash_session` tool to execute `npm run check`, `npm run lint`, and `npm run test` to verify the changes didn't break existing functionality.

4. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit the PR**
   - I will use the `submit` tool to submit the PR with the following details:
     - `branch_name`: `bolt-optimize-dashboard-stats`
     - `title`: `⚡ Bolt: Optimize getDashboardStats queries`
     - `commit_message`: `Optimize getDashboardStats by consolidating COUNT queries`
     - `description`: `💡 What: Consolidated 9 individual COUNT(*) queries down to 5 queries inside getDashboardStats by using conditional aggregation for jobs, defects, and certificates tables.
🎯 Why: Multiple queries were unnecessarily scanning the same tables (e.g., jobs, defects), increasing database engine overhead and query latency.
📊 Impact: Reduces redundant table scans and database batch query count, lowering overall latency for fetching dashboard statistics.
🔬 Measurement: Verify by loading the dashboard and observing the DB query log or page load time.`
