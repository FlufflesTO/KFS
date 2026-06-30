1. Modify `src/lib/server/db/staff-repository.ts` to add a new function `listAllStaffFiles(db: D1Database): Promise<DbStaffFile[]>`.
2. Update `src/pages/portal/admin/hr.astro` to use `listAllStaffFiles` and group the files by `staff_member_id` in memory to eliminate the N+1 query issue.
