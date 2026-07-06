1.  **Refactor `staffWithFiles` fetching in `src/pages/portal/admin/hr.astro`**
    *   Currently, the code iterates over `members` and calls `listStaffFiles` for each member inside a `Promise.all()`, leading to N+1 queries.
    *   We will modify `src/lib/server/db/staff-repository.ts` to add a new function, `listAllStaffFiles(db: D1Database)`, or similar, which fetches *all* staff files in one query. Or we can pass an array of member IDs. Since we're fetching files for all staff members, fetching all files and grouping them in memory is much faster.
    *   Actually, a single query `SELECT * FROM staff_files WHERE deleted_at IS NULL` is sufficient if we just group by `staff_member_id` in memory. Let's create `listAllStaffFiles(db: D1Database): Promise<DbStaffFile[]>` in `src/lib/server/db/staff-repository.ts`.
    *   Modify `src/pages/portal/admin/hr.astro` to use this new function. It will fetch all members and all files, then iterate over members and attach the corresponding files.

2.  **Add `listAllStaffFiles` to `src/lib/server/db/staff-repository.ts`**
    *   `export async function listAllStaffFiles(db: D1Database): Promise<DbStaffFile[]> { ... }`
    *   Query: `SELECT id, staff_member_id, file_name, file_type, r2_key, uploaded_by, uploaded_at, deleted_at FROM staff_files WHERE deleted_at IS NULL ORDER BY uploaded_at DESC`

3.  **Run tests and formatting**
    *   Ensure the code compiles successfully (`pnpm check` and `pnpm lint`).
    *   Run tests (`pnpm test`).

4.  **Create PR with Bolt format**
