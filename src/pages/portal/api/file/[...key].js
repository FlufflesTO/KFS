import { getBindings } from "../../../../lib/server/bindings.js";
import { forbidden, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.js";

export const prerender = false;

export async function GET({ params, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();

    const key = String(params.key || "");
    if (!key.startsWith("jobcards/") || !key.endsWith(".pdf") || key.includes("..")) {
      return forbidden("Invalid document path.");
    }

    const { db, storage } = getBindings();
    const record = await db
      .prepare(
        `SELECT jobs.documentation_path, systems.site_id, jobs.assigned_technician_id
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         WHERE jobs.documentation_path = ?1
         LIMIT 1`
      )
      .bind(key)
      .first();

    if (!record) return forbidden("Document is not available.");

    const allowed =
      user.role === "admin" ||
      user.role === "finance" ||
      (user.role === "tech" && record.assigned_technician_id === user.id) ||
      (user.role === "client" && record.site_id === user.siteId);

    if (!allowed) return forbidden("Document access is not permitted for this account.");

    const object = await storage.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=300");
    headers.set("content-type", headers.get("content-type") || "application/pdf");

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("document retrieval failed", error);
    return serverError("Document retrieval failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["GET"]);
}
