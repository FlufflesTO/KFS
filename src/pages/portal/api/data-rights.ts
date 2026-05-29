// @ts-nocheck
import { auditError } from "../../../lib/server/audit";
import { getDatabase } from "../../../lib/server/bindings.ts";
import { auditEvent } from "../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.ts";

export const prerender = false;

export async function POST({ request, locals }: import('astro').APIContext) {
  const user = locals.user;
  if (!user) return unauthorized();

  try {
    const body = await request.json() as any;
    const action = String(body.action || "").trim();
    const db = getDatabase();

    if (action === "export") {
      await auditEvent(db, request, {
        eventType: "privacy.data_export_requested",
        entityType: "user",
        entityId: user.id,
        outcome: "success",
        user
      });
      return json({ 
        ok: true, 
        message: "Your data export request has been logged. An administrator will process this and email you the archive securely within 72 hours." 
      });
    }

    if (action === "delete") {
      // Note: Full deletion violates forensic ledger constraints.
      // A soft-delete/anonymization protocol should be enforced here.
      await auditEvent(db, request, {
        eventType: "privacy.data_deletion_requested",
        entityType: "user",
        entityId: user.id,
        outcome: "success",
        user
      });
      return json({ 
        ok: true, 
        message: "Your account deletion request has been logged. An administrator will review your active operations and process the anonymization in accordance with POPIA regulations." 
      });
    }

    return badRequest("Invalid data rights action.");
  } catch (error: any) {
    await auditError(typeof db !== "undefined" ? db : getDatabase(), request, error, { user: user, metadata: { message: "data rights action failed" } });
    return serverError("Your request could not be processed at this time.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}

