import type { D1Database } from "@cloudflare/workers-types";
import type {
  DbStaffDocument,
  DbStaffLeaveBalance,
  DbStaffLeaveRequest,
  DbUserProfile,
  StaffDocumentCategory,
  StaffLeaveType
} from "@sentinel/types";

export interface ProfileInput {
  preferredName: string | null;
  phone: string | null;
  jobTitle: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notificationEmail: string | null;
  portalDensity: "compact" | "comfortable";
}

export interface LeaveRequestInput {
  userId: string;
  leaveType: StaffLeaveType;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string | null;
  supportingDocumentId?: string | null;
}

export interface StaffDocumentInput {
  userId: string;
  category: StaffDocumentCategory;
  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string;
}

export class StaffRepository {
  constructor(private db: D1Database) {}

  async findProfile(userId: string): Promise<DbUserProfile | null> {
    const row = await this.db
      .prepare(`SELECT * FROM user_profiles WHERE user_id = ?1 LIMIT 1`)
      .bind(userId)
      .first<DbUserProfile>();
    return row || null;
  }

  async upsertProfile(userId: string, input: ProfileInput): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO user_profiles
           (user_id, preferred_name, phone, job_title, emergency_contact_name, emergency_contact_phone, notification_email, portal_density)
         VALUES
           (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(user_id) DO UPDATE SET
           preferred_name = excluded.preferred_name,
           phone = excluded.phone,
           job_title = excluded.job_title,
           emergency_contact_name = excluded.emergency_contact_name,
           emergency_contact_phone = excluded.emergency_contact_phone,
           notification_email = excluded.notification_email,
           portal_density = excluded.portal_density`
      )
      .bind(
        userId,
        input.preferredName,
        input.phone,
        input.jobTitle,
        input.emergencyContactName,
        input.emergencyContactPhone,
        input.notificationEmail,
        input.portalDensity
      )
      .run();
  }

  async ensureLeaveBalance(userId: string): Promise<DbStaffLeaveBalance> {
    await this.db
      .prepare(`INSERT OR IGNORE INTO staff_leave_balances (user_id) VALUES (?1)`)
      .bind(userId)
      .run();

    const row = await this.db
      .prepare(`SELECT * FROM staff_leave_balances WHERE user_id = ?1 LIMIT 1`)
      .bind(userId)
      .first<DbStaffLeaveBalance>();

    if (!row) throw new Error("Leave balance could not be initialized.");
    return row;
  }

  async recentLeaveRequests(userId: string, limit: number = 12): Promise<DbStaffLeaveRequest[]> {
    const result = await this.db
      .prepare(
        `SELECT *
         FROM staff_leave_requests
         WHERE user_id = ?1 AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT ?2`
      )
      .bind(userId, limit)
      .all<DbStaffLeaveRequest>();
    return result.results || [];
  }

  async createLeaveRequest(input: LeaveRequestInput): Promise<string> {
    const id = crypto.randomUUID();
    await this.db
      .prepare(
        `INSERT INTO staff_leave_requests
           (id, user_id, leave_type, start_date, end_date, days_requested, reason, supporting_document_id)
         VALUES
           (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(
        id,
        input.userId,
        input.leaveType,
        input.startDate,
        input.endDate,
        input.daysRequested,
        input.reason,
        input.supportingDocumentId || null
      )
      .run();
    return id;
  }

  async recentDocuments(userId: string, limit: number = 20): Promise<DbStaffDocument[]> {
    const result = await this.db
      .prepare(
        `SELECT *
         FROM staff_documents
         WHERE user_id = ?1 AND deleted_at IS NULL
         ORDER BY uploaded_at DESC
         LIMIT ?2`
      )
      .bind(userId, limit)
      .all<DbStaffDocument>();
    return result.results || [];
  }

  async findDocumentForUser(documentId: string, userId: string, isAdmin: boolean): Promise<DbStaffDocument | null> {
    const row = await this.db
      .prepare(
        `SELECT *
         FROM staff_documents
         WHERE id = ?1
           AND deleted_at IS NULL
           AND (?3 = 1 OR user_id = ?2)
         LIMIT 1`
      )
      .bind(documentId, userId, isAdmin ? 1 : 0)
      .first<DbStaffDocument>();
    return row || null;
  }

  async createDocument(input: StaffDocumentInput): Promise<string> {
    const id = crypto.randomUUID();
    await this.db
      .prepare(
        `INSERT INTO staff_documents
           (id, user_id, category, file_name, storage_path, content_type, size_bytes, uploaded_by_user_id)
         VALUES
           (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(
        id,
        input.userId,
        input.category,
        input.fileName,
        input.storagePath,
        input.contentType,
        input.sizeBytes,
        input.uploadedByUserId
      )
      .run();
    return id;
  }
}
