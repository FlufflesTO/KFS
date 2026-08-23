1. **Add `listAllStaffFiles` to `src/lib/server/db/staff-repository.ts`**
   - Implement `listAllStaffFiles(db: D1Database): Promise<DbStaffFile[]>` which fetches all undeleted staff files (`SELECT * FROM staff_files WHERE deleted_at IS NULL ORDER BY uploaded_at DESC`).

2. **Refactor `src/pages/portal/admin/hr.astro`**
   - Fetch `members` using `listStaffMembers(db)`.
   - Fetch `allFiles` using `listAllStaffFiles(db)`.
   - Map over `members` and attach files by filtering `allFiles` matching `m.id`.
   - This eliminates the N+1 query problem, replacing N `listStaffFiles` calls inside a `Promise.all` mapping loop with a single query.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run typecheck and tests.

4. **Submit PR**
   - Create a PR detailing the performance improvement.
