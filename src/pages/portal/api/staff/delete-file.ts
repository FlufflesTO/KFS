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
import { getStaffFile, softDeleteStaffFile } from "../../../../lib/server/db/staff-repository";

export const prerender = false;

export async function POST({ request, locals }: APIContext): Promise<Response> {
  const user = locals.user;
  if (!user) return unauthorized();
  const adminError = requireAdmin(user);
  if (adminError) return adminError;

  let db: ReturnType<typeof getDatabase> | undefined;

  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Request body must be valid JSON.");
    }

    const fileId = String(body.fileId ?? "").trim();
    if (!fileId) return badRequest("fileId is required.");

    db = getDatabase();

    const file = await getStaffFile(db, fileId);
    if (!file) return badRequest("File not found.");

    // Remove from R2 first — if this fails we have not lost the D1 record
    const storage = getStorage();
    await storage.delete(file.r2_key);

    await softDeleteStaffFile(db, fileId);

    await auditEvent(db, request, {
      eventType: "hr.staff_file_delete",
      entityType: "staff_file",
      entityId: fileId,
      outcome: "success",
      user,
      metadata: { r2_key: file.r2_key, fileName: file.file_name },
    });

    return json({ ok: true, message: "File deleted." });
  } catch (error) {
    if (db) {
      await auditError(db, request, error as Error, { user, metadata: {} }).catch(() => {});
    }
    console.error("Staff file delete failed:", error);
    return serverError("File deletion could not be completed.");
  }
}

export function GET(): Response {
  return forbidden("Use POST to delete staff files.");
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
