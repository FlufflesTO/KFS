
import type { D1Database } from "@cloudflare/workers-types";
import type { DbStaffMember, DbStaffFile } from "@sentinel/types";

/**
 * Staff HR Repository
 * Abstraction layer for staff_members and staff_files tables.
 * Enforces soft-delete pattern (deleted_at IS NULL) on all reads.
 */

// Re-export for consumers that import from this module directly
export type { DbStaffMember, DbStaffFile };

export interface CreateStaffMemberData {
  full_name: string;
  role_title: string;
  email?: string | null;
  phone?: string | null;
  start_date?: string | null;
  employment_type: string;
  status: string;
  notes?: string | null;
}

export interface UpdateStaffMemberData {
  full_name?: string;
  role_title?: string;
  email?: string | null;
  phone?: string | null;
  start_date?: string | null;
  employment_type?: string;
  status?: string;
  notes?: string | null;
}

export interface CreateStaffFileData {
  staff_member_id: string;
  file_name: string;
  file_type: string;
  r2_key: string;
  uploaded_by: string;
}

export async function listStaffMembers(db: D1Database): Promise<DbStaffMember[]> {
  const results = await db
    .prepare(
      `SELECT sm.id, sm.full_name, sm.role_title, sm.email, sm.phone,
              sm.start_date, sm.employment_type, sm.status, sm.notes,
              sm.created_at, sm.updated_at, sm.deleted_at,
              COUNT(sf.id) AS file_count
       FROM staff_members sm
       LEFT JOIN staff_files sf
         ON sf.staff_member_id = sm.id AND sf.deleted_at IS NULL
       WHERE sm.deleted_at IS NULL
       GROUP BY sm.id
       ORDER BY sm.full_name ASC`
    )
    .all<DbStaffMember>();
  return results.results ?? [];
}

export async function getStaffMember(
  db: D1Database,
  id: string
): Promise<(DbStaffMember & { files: DbStaffFile[] }) | null> {
  const member = await db
    .prepare(
      `SELECT id, full_name, role_title, email, phone, start_date,
              employment_type, status, notes, created_at, updated_at, deleted_at
       FROM staff_members
       WHERE id = ?1 AND deleted_at IS NULL
       LIMIT 1`
    )
    .bind(id)
    .first<DbStaffMember>();

  if (!member) return null;

  const filesResult = await db
    .prepare(
      `SELECT id, staff_member_id, file_name, file_type, r2_key,
              uploaded_by, uploaded_at, deleted_at
       FROM staff_files
       WHERE staff_member_id = ?1 AND deleted_at IS NULL
       ORDER BY uploaded_at DESC`
    )
    .bind(id)
    .all<DbStaffFile>();

  return { ...member, files: filesResult.results ?? [] };
}

export async function createStaffMember(
  db: D1Database,
  data: CreateStaffMemberData
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO staff_members
         (id, full_name, role_title, email, phone, start_date, employment_type, status, notes)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(
      id,
      data.full_name,
      data.role_title,
      data.email ?? null,
      data.phone ?? null,
      data.start_date ?? null,
      data.employment_type,
      data.status,
      data.notes ?? null
    )
    .run();
  return id;
}

export async function updateStaffMember(
  db: D1Database,
  id: string,
  data: UpdateStaffMemberData
): Promise<void> {
  await db
    .prepare(
      `UPDATE staff_members
       SET full_name      = COALESCE(?1, full_name),
           role_title     = COALESCE(?2, role_title),
           email          = COALESCE(?3, email),
           phone          = COALESCE(?4, phone),
           start_date     = COALESCE(?5, start_date),
           employment_type= COALESCE(?6, employment_type),
           status         = COALESCE(?7, status),
           notes          = COALESCE(?8, notes),
           updated_at     = datetime('now')
       WHERE id = ?9 AND deleted_at IS NULL`
    )
    .bind(
      data.full_name ?? null,
      data.role_title ?? null,
      data.email ?? null,
      data.phone ?? null,
      data.start_date ?? null,
      data.employment_type ?? null,
      data.status ?? null,
      data.notes ?? null,
      id
    )
    .run();
}

export async function softDeleteStaffMember(db: D1Database, id: string): Promise<void> {
  await db
    .prepare(
      `UPDATE staff_members
       SET deleted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?1 AND deleted_at IS NULL`
    )
    .bind(id)
    .run();
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

export async function getStaffFile(
  db: D1Database,
  id: string
): Promise<DbStaffFile | null> {
  const file = await db
    .prepare(
      `SELECT id, staff_member_id, file_name, file_type, r2_key,
              uploaded_by, uploaded_at, deleted_at
       FROM staff_files
       WHERE id = ?1 AND deleted_at IS NULL
       LIMIT 1`
    )
    .bind(id)
    .first<DbStaffFile>();
  return file ?? null;
}

export async function createStaffFile(
  db: D1Database,
  data: CreateStaffFileData
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO staff_files
         (id, staff_member_id, file_name, file_type, r2_key, uploaded_by)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(
      id,
      data.staff_member_id,
      data.file_name,
      data.file_type,
      data.r2_key,
      data.uploaded_by
    )
    .run();
  return id;
}

export async function softDeleteStaffFile(db: D1Database, id: string): Promise<void> {
  await db
    .prepare(
      `UPDATE staff_files
       SET deleted_at = datetime('now')
       WHERE id = ?1 AND deleted_at IS NULL`
    )
    .bind(id)
    .run();
}

export async function listAllStaffFiles(
  db: D1Database
): Promise<DbStaffFile[]> {
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
