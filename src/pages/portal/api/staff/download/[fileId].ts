import type { APIContext } from "astro";
import { getDatabase, getStorage } from "../../../../../lib/server/bindings";
import { auditEvent, auditError } from "../../../../../lib/server/audit";
import { requireAdmin } from "../../../../../lib/server/access";
import {
  badRequest,
  methodNotAllowed,
  serverError,
  unauthorized,
} from "../../../../../lib/server/http.ts";
import { getStaffFile } from "../../../../../lib/server/db/staff-repository";

export const prerender = false;

export async function GET({ params, request, locals }: APIContext): Promise<Response> {
  const user = locals.user;
  if (!user) return unauthorized();
  const adminError = requireAdmin(user);
  if (adminError) return adminError;

  const fileId = params.fileId ?? "";
  if (!fileId) return badRequest("fileId is required.");

  let db: ReturnType<typeof getDatabase> | undefined;

  try {
    db = getDatabase();

    const file = await getStaffFile(db, fileId);
    if (!file) return badRequest("File not found.");

    const storage = getStorage();
    const object = await storage.get(file.r2_key);
    if (!object) return badRequest("File data not found in storage.");

    await auditEvent(db, request, {
      eventType: "hr.staff_file_download",
      entityType: "staff_file",
      entityId: fileId,
      outcome: "success",
      user,
      metadata: { fileName: file.file_name },
    });

    const responseHeaders: Record<string, string> = {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="${encodeURIComponent(file.file_name)}"`,
    };
    if (object.httpMetadata?.contentType) {
      responseHeaders["content-type"] = object.httpMetadata.contentType;
    }

    // Stream the R2 object body directly; cast needed due to R2 vs standard ReadableStream types
    return new Response(object.body as unknown as BodyInit, { headers: responseHeaders });
  } catch (error) {
    if (db) {
      await auditError(db, request, error as Error, { user, metadata: { fileId } }).catch(() => {});
    }
    console.error("Staff file download failed:", error);
    return serverError("File download could not be completed.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["GET"]);
}
