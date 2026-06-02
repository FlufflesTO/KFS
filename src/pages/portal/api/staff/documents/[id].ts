import type { APIContext } from "astro";
import { auditError, documentAccessLog } from "../../../../../lib/server/audit";
import { getBindings } from "../../../../../lib/server/bindings";
import { StaffRepository } from "../../../../../lib/server/db/staff-repository";
import { forbidden, methodNotAllowed, serverError, unauthorized } from "../../../../../lib/server/http";

export const prerender = false;

export async function GET({ params, locals, request }: APIContext): Promise<Response> {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!["admin", "finance", "tech"].includes(user.role)) return forbidden("Only internal staff accounts can access HR documents.");

  const { db, storage } = getBindings();
  try {
    const id = String(params.id || "");
    if (!/^[A-Za-z0-9_-]{3,120}$/.test(id)) return forbidden("Invalid document id.");

    const repo = new StaffRepository(db);
    const document = await repo.findDocumentForUser(id, user.id, user.role === "admin");
    if (!document) {
      await documentAccessLog(db, request, {
        user,
        documentType: "Staff HR Document",
        outcome: "blocked",
        reason: "missing_or_denied"
      });
      return forbidden("Document access is not permitted for this account.");
    }

    const object = await storage.get(document.storage_path);
    if (!object) {
      await documentAccessLog(db, request, {
        user,
        storagePath: document.storage_path,
        documentType: "Staff HR Document",
        outcome: "failure",
        reason: "missing_r2_object"
      });
      return new Response("Not found", { status: 404 });
    }

    await documentAccessLog(db, request, {
      user,
      storagePath: document.storage_path,
      documentType: "Staff HR Document",
      outcome: "success"
    });

    const headers = new Headers();
    object.writeHttpMetadata(headers as unknown as import("@cloudflare/workers-types").Headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=300, must-revalidate");
    headers.set("content-type", headers.get("content-type") || document.content_type);
    headers.set("content-disposition", `inline; filename="${document.file_name.replaceAll('"', "")}"`);

    return new Response(object.body as unknown as ReadableStream<Uint8Array>, { headers });
  } catch (error) {
    await auditError(db, request, error as Error, { user, entityType: "staff_document", entityId: params.id });
    return serverError("Staff document retrieval failed.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["GET"]);
}
