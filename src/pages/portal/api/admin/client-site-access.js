import { auditError } from "../../../../lib/server/audit.js";
import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanChoice, cleanId, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

export async function POST({ request, locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const action = cleanChoice(body.action, "action", ["grant", "revoke"]);
    const userId = cleanId(body.userId, "userId");
    const siteId = cleanId(body.siteId, "siteId");

    const target = await db
      .prepare(`SELECT id, role, is_active FROM users WHERE id = ?1 LIMIT 1`)
      .bind(userId)
      .first();
    if (!target || target.role !== "client" || !target.is_active) {
      return badRequest("Only active client users can be mapped to client sites.");
    }

    const site = await db.prepare(`SELECT id FROM sites WHERE id = ?1 LIMIT 1`).bind(siteId).first();
    if (!site) return badRequest("Selected site does not exist.");

    if (action === "grant") {
      await db
        .prepare(
          `INSERT INTO client_site_access (user_id, site_id, access_level, granted_by_user_id)
           VALUES (?1, ?2, 'records', ?3)
           ON CONFLICT(user_id, site_id) DO UPDATE SET
             access_level = 'records',
             granted_by_user_id = excluded.granted_by_user_id,
             granted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
        )
        .bind(userId, siteId, locals.user.id)
        .run();
    } else {
      await db
        .prepare(`DELETE FROM client_site_access WHERE user_id = ?1 AND site_id = ?2`)
        .bind(userId, siteId)
        .run();
    }

    await auditEvent(db, request, {
      eventType: `admin.client_site_access.${action}`,
      entityType: "client_site_access",
      entityId: `${userId}:${siteId}`,
      outcome: "success",
      user: locals.user,
      metadata: { userId, siteId }
    });

    return json({ ok: true, userId, siteId, action });
  } catch (error) {
    if (error.message) return badRequest(error.message);
    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "client site access admin failed" } });
    return serverError("Client site access update failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
