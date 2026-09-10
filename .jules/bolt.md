## 2026-09-10 - Combine Multiple Counts into Conditional Aggregates\n**Learning:** Executing multiple separate  queries on the same tables using  causes redundant table scans and increases D1 execution time.\n**Action:** Consolidate independent counts into a single batched query using conditional aggregation (), which allows evaluating multiple metrics in a single pass.

## 2026-09-10 - Combine Multiple Counts into Conditional Aggregates
**Learning:** Executing multiple separate `COUNT(*)` queries on the same tables using `db.batch()` causes redundant table scans and increases D1 execution time.
**Action:** Consolidate independent counts into a single batched query using conditional aggregation (`SUM(CASE WHEN condition THEN 1 ELSE 0 END)`), which allows evaluating multiple metrics in a single pass.
