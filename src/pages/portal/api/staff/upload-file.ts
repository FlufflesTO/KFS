import type { APIContext } from "astro";
import { getDatabase, getStorage } from "../../../../lib/server/bindings";
import { auditEvent, auditError } from "../../../../lib/server/audit";
import { requireAdmin } from "../../../../lib/server/access";
import {
  badRequest,
  forbidden,
  json,
  methodNotAllowed,
  serverError,
  unauthorized,
} from "../../../../lib/server/http.ts";
import { createStaffFile, getStaffMember } from "../../../../lib/server/db/staff-repository";

export const prerender = false;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const VALID_FILE_TYPES = new Set<string>(["ID Document", "Contract", "Certificate", "Other"]);

function isValidFileContent(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer);

  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // WebP: RIFF ... WEBP
  if (bytes.byteLength >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  // DOC (OLE2): D0 CF 11 E0
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return true;
  // DOCX (ZIP): 50 4B 03 04
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return true;

  return false;
}


export async function POST({ request, locals }: APIContext): Promise<Response> {
  const user = locals.user;
  if (!user) return unauthorized();
  const adminError = requireAdmin(user);
  if (adminError) return adminError;

  let db: ReturnType<typeof getDatabase> | undefined;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return badRequest("Request must be multipart/form-data.");
    }

    const formData = await request.formData();
    const memberId = String(formData.get("member_id") ?? "").trim();
    const fileType = String(formData.get("file_type") ?? "Other").trim();
    const fileField = formData.get("file");

    if (!memberId) return badRequest("member_id is required.");
    if (!VALID_FILE_TYPES.has(fileType)) return badRequest("Invalid file_type.");
    if (!fileField || !(fileField instanceof File)) return badRequest("No file uploaded.");

    if (fileField.size > MAX_FILE_SIZE) return badRequest("File exceeds 10 MB limit.");
    if (!ALLOWED_MIME_TYPES.has(fileField.type)) {
      return badRequest("File type not allowed. Permitted: PDF, images (JPEG/PNG/WebP), Word documents.");
    }

    db = getDatabase();

    const member = await getStaffMember(db, memberId);
    if (!member) return badRequest("Staff member not found.");

    const storage = getStorage();
    const fileUuid = crypto.randomUUID();
    // Sanitize filename — strip path traversal characters
    const safeName = fileField.name.replace(/[^a-zA-Z0-9._\- ]/g, "_").slice(0, 200);
    const r2Key = `staff-files/${memberId}/${fileUuid}/${safeName}`;

    const fileBuffer = await fileField.arrayBuffer();
    if (!isValidFileContent(fileBuffer)) {
      return badRequest("Invalid file content detected. Magic number verification failed.");
    }
    await storage.put(r2Key, fileBuffer, {
      httpMetadata: { contentType: fileField.type },
      customMetadata: { uploadedBy: user.id, staffMemberId: memberId },
    });

    const fileId = await createStaffFile(db, {
      staff_member_id: memberId,
      file_name: safeName,
      file_type: fileType,
      r2_key: r2Key,
      uploaded_by: user.id,
    });

    await auditEvent(db, request, {
      eventType: "hr.staff_file_upload",
      entityType: "staff_file",
      entityId: fileId,
      outcome: "success",
      user,
      metadata: { memberId, fileName: safeName, fileType },
    });

    return json({ ok: true, fileId, message: "File uploaded successfully." });
  } catch (error) {
    if (db) {
      await auditError(db, request, error as Error, { user, metadata: {} }).catch(() => {});
    }
    console.error("Staff file upload failed:", error);
    return serverError("File upload could not be completed.");
  }
}

export function GET(): Response {
  return forbidden("Use POST to upload staff files.");
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
