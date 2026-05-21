import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { createSessionToken, hashPassword, sessionCookie, verifyPassword } from "../../../lib/server/auth.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

export async function POST({ request, locals }) {
  const db = getDatabase();
  const user = locals.user;

  try {
    if (!user) return unauthorized();

    const body = await request.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return badRequest("Current password, new password and confirmation are required.");
    }

    if (newPassword !== confirmPassword) {
      return badRequest("The new password and confirmation do not match.");
    }

    if (newPassword.length < 14) {
      return badRequest("Use a password of at least 14 characters.");
    }

    if (newPassword === currentPassword) {
      return badRequest("The new password must differ from the current password.");
    }

    const record = await db
      .prepare(`SELECT id, name, email, password_hash, role, site_id FROM users WHERE id = ?1 AND is_active = 1 LIMIT 1`)
      .bind(user.id)
      .first();

    if (!record) {
      await auditEvent(db, request, {
        eventType: "auth.password_change",
        entityType: "user",
        entityId: user.id,
        outcome: "failure",
        user,
        metadata: { reason: "missing_user" }
      });
      return forbidden("This account is not available.");
    }

    const verified = await verifyPassword(currentPassword, record.password_hash);
    if (!verified) {
      await auditEvent(db, request, {
        eventType: "auth.password_change",
        entityType: "user",
        entityId: user.id,
        outcome: "failure",
        user,
        metadata: { reason: "bad_current_password" }
      });
      return unauthorized("Current password is incorrect.");
    }

    const nextHash = await hashPassword(newPassword);
    await db
      .prepare(
        `UPDATE users
         SET password_hash = ?1,
             force_password_change = 0,
             password_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?2`
      )
      .bind(nextHash, user.id)
      .run();

    const token = await createSessionToken({ ...record, force_password_change: 0 });

    await auditEvent(db, request, {
      eventType: "auth.password_change",
      entityType: "user",
      entityId: user.id,
      outcome: "success",
      user
    });

    return json(
      { ok: true, redirectTo: "/portal" },
      {
        headers: {
          "Set-Cookie": sessionCookie(token)
        }
      }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    console.error("password change failed", error);
    return serverError("Password could not be changed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
