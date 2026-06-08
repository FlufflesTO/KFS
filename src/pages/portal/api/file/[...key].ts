import type { APIContext } from "astro";
import { auditError, documentAccessLog } from "../../../../lib/server/audit";
import { getBindings } from "../../../../lib/server/bindings.ts";
import { clientCanAccessSite } from "../../../../lib/server/access";
import { forbidden, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http.ts";

export const prerender = false;


import type { SessionUser } from "../../../../lib/server/auth.ts";

async function getDocumentRecord(db: import("@cloudflare/workers-types").D1Database, key: string, isJobcard: boolean): Promise<DocumentRecord | null> {
  if (isJobcard) {
    return await db
      .prepare(
        `SELECT jobs.documentation_path, systems.site_id, jobs.assigned_technician_id
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.documentation_path = ?1
         LIMIT 1`
      )
      .bind(key)
      .first<DocumentRecord>();
  } else {
    return await db
      .prepare(
        `SELECT job_evidence_files.storage_path AS documentation_path, systems.site_id, jobs.assigned_technician_id
         FROM job_evidence_files
         INNER JOIN jobs ON jobs.id = job_evidence_files.job_id
         INNER JOIN systems ON systems.id = job_evidence_files.system_id
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND job_evidence_files.storage_path = ?1
         LIMIT 1`
      )
      .bind(key)
      .first<DocumentRecord>();
  }
}

async function checkAccess(db: import("@cloudflare/workers-types").D1Database, user: SessionUser, record: DocumentRecord): Promise<boolean> {
  const clientAllowed = user.role === "client" && (await clientCanAccessSite(db, user, record.site_id));
  return (
    user.role === "admin" ||
    user.role === "finance" ||
    (user.role === "tech" && record.assigned_technician_id === user.id) ||
    clientAllowed
  );
}

function createFileResponse(
  object: import("@cloudflare/workers-types").R2ObjectBody,
  key: string,
  isJobcard: boolean,
  isEvidence: boolean
): Response {
  const headers = new Headers();
  object.writeHttpMetadata(headers as unknown as import("@cloudflare/workers-types").Headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=3600, must-revalidate");
  headers.set("content-type", headers.get("content-type") || (isJobcard ? "application/pdf" : "image/jpeg"));

  const filename = key.split('/').pop() || 'document';
  headers.set("content-disposition", `inline; filename="${filename}"`);

  if (isEvidence) {
    headers.set("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; sandbox");
  }

  return new Response(object.body as unknown as ReadableStream<Uint8Array>, { headers });
}

interface DocumentRecord {
  documentation_path?: string;
  site_id: string;
  assigned_technician_id: string | null;
}

export async function GET({ params, locals, request }: APIContext): Promise<Response> {
  let dbInstance;
  let user = locals.user;

  try {
    if (!user) return unauthorized();

    const key = String(params.key || "");
    const isJobcard = key.startsWith("jobcards/") && key.endsWith(".pdf");
    const isEvidence = key.startsWith("job-evidence/") && /\.(jpg|jpeg|png|webp)$/i.test(key);
    
    if ((!isJobcard && !isEvidence) || key.includes("..") || key.includes("\0")) {
      return forbidden("Invalid document path.");
    }

    const { db, storage } = getBindings();
    dbInstance = db;
    const documentType = isJobcard ? "Jobcard PDF" : "Evidence Photo";
    
    const record = await getDocumentRecord(db, key, isJobcard);

    if (!record) {
      await documentAccessLog(db, request, {
        user,
        storagePath: key,
        documentType,
        outcome: "failure",
        reason: "missing_record"
      });
      return forbidden("Document is not available.");
    }

    const allowed = await checkAccess(db, user, record);

    if (!allowed) {
      await documentAccessLog(db, request, {
        user,
        siteId: record.site_id,
        storagePath: key,
        documentType,
        outcome: "blocked",
        reason: "rbac_denied"
      });
      return forbidden("Document access is not permitted for this account.");
    }

    const object = await storage.get(key);
    if (!object) {
      await documentAccessLog(db, request, {
        user,
        siteId: record.site_id,
        storagePath: key,
        documentType,
        outcome: "failure",
        reason: "missing_r2_object"
      });
      return new Response("Not found", { status: 404 });
    }

    await documentAccessLog(db, request, {
      user,
      siteId: record.site_id,
      storagePath: key,
      documentType,
      outcome: "success"
    });

    return createFileResponse(object, key, isJobcard, isEvidence);
  } catch (error) {
    if (dbInstance) {
      await auditError(dbInstance, request, error as Error, { 
        user, 
        metadata: { message: "document retrieval failed", path: params.key } 
      });
    }
    return serverError("Document retrieval failed.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["GET"]);
}
