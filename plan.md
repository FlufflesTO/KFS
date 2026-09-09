1. **Optimize staff data fetching in `src/lib/server/db/staff-repository.ts`**:
   - Use the `replace_with_git_merge_diff` tool to add a new function `listAllStaffFiles` that fetches all staff files in a single query (where `deleted_at IS NULL`).
   - The diff will look like this:
<<<<<<< SEARCH
export async function listStaffFiles(
  db: D1Database,
  memberId: string
): Promise<DbStaffFile[]> {
  const results = await db
    .prepare(
      `SELECT id, staff_member_id, file_name, file_type, r2_key,
              uploaded_by, uploaded_at, deleted_at
       FROM staff_files
       WHERE staff_member_id = ?1 AND deleted_at IS NULL
       ORDER BY uploaded_at DESC`
    )
    .bind(memberId)
    .all<DbStaffFile>();
  return results.results ?? [];
}
=======
export async function listAllStaffFiles(db: D1Database): Promise<DbStaffFile[]> {
  const results = await db
    .prepare(
      `SELECT id, staff_member_id, file_name, file_type, r2_key,
              uploaded_by, uploaded_at, deleted_at
       FROM staff_files
       WHERE deleted_at IS NULL
       ORDER BY uploaded_at DESC`
    )
    .all<DbStaffFile>();
  return results.results ?? [];
}

export async function listStaffFiles(
  db: D1Database,
  memberId: string
): Promise<DbStaffFile[]> {
  const results = await db
    .prepare(
      `SELECT id, staff_member_id, file_name, file_type, r2_key,
              uploaded_by, uploaded_at, deleted_at
       FROM staff_files
       WHERE staff_member_id = ?1 AND deleted_at IS NULL
       ORDER BY uploaded_at DESC`
    )
    .bind(memberId)
    .all<DbStaffFile>();
  return results.results ?? [];
}
>>>>>>> REPLACE

2. **Refactor `src/pages/portal/admin/hr.astro` to remove N+1 query**:
   - Use the `replace_with_git_merge_diff` tool to change the way files are fetched.
   - We will replace `Promise.all()` calling `listStaffFiles(db, m.id)` per member with a single call to `listAllStaffFiles(db)` and grouping them by `staff_member_id`.
   - The diff will look like this:
<<<<<<< SEARCH
import type { DbStaffMember, DbStaffFile } from "../../../lib/server/db/staff-repository";
import { listStaffMembers, listStaffFiles } from "../../../lib/server/db/staff-repository";

export const prerender = false;
=======
import type { DbStaffMember, DbStaffFile } from "../../../lib/server/db/staff-repository";
import { listStaffMembers, listStaffFiles, listAllStaffFiles } from "../../../lib/server/db/staff-repository";

export const prerender = false;
>>>>>>> REPLACE

<<<<<<< SEARCH
try {
  const db = getDatabase();
  const members = await listStaffMembers(db);
  staffWithFiles = await Promise.all(
    members.map(async (m) => {
      const files = await listStaffFiles(db, m.id);
      return { ...m, files, file_count: files.length };
    })
  );
} catch (err) {
  loadError = "Failed to load staff data.";
=======
try {
  const db = getDatabase();
  const members = await listStaffMembers(db);

  const allFiles = await listAllStaffFiles(db);
  const filesByMemberId = allFiles.reduce<Record<string, DbStaffFile[]>>((acc, file) => {
    if (!acc[file.staff_member_id]) {
      acc[file.staff_member_id] = [];
    }
    acc[file.staff_member_id].push(file);
    return acc;
  }, {});

  staffWithFiles = members.map((m) => {
    const files = filesByMemberId[m.id] || [];
    return { ...m, files, file_count: files.length };
  });
} catch (err) {
  loadError = "Failed to load staff data.";
>>>>>>> REPLACE

3. Use `run_in_bash_session` to run `git diff` to confirm the file changes were written correctly.

4. **Verify the changes locally**:
   - Run type checks and linters (`npm run check`, `npm run lint`) to ensure the new code has no errors and conforms to the project standard.
   - Run tests (`npm run test`) to make sure everything passes.

5. **Complete pre commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

6. **Submit the PR**:
   - Use the `submit` tool with proper Bolt PR formatting (title and description) containing What, Why, Impact, and Measurement.
