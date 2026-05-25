import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

export async function POST({ request, locals }) {
  const user = locals.user;
  if (!user) return unauthorized();

  try {
    const body = await request.json();
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
  } catch (error) {
    console.error("data rights action failed", error);
    return serverError("Your request could not be processed at this time.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
