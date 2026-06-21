1. **Optimize `getClientDashboardData` in `src/lib/server/db-optimization.ts`**
   - Replace `Promise.all` containing multiple `.all()` query executions with `db.batch()`.
   - This reduces 5 separate database HTTP roundtrips to a single D1 API roundtrip, significantly improving latency.

2. **Fix N+1 query in `src/pages/portal/admin/hr.astro`**
   - Replace the `Promise.all(members.map(...))` loop that calls `listStaffFiles` per member.
   - Fetch all staff files in one query and group them in memory, dropping N database queries down to just 1.

3. **Update Bolt Journal (`.jules/bolt.md`)**
   - Add an entry documenting the importance of `db.batch()` over `Promise.all()` for D1 and avoiding N+1 queries.

4. **Complete pre commit steps**
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit PR**
   - Create a PR using the `⚡ Bolt: [performance improvement]` format as requested.
