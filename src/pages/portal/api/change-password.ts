import type { APIRoute } from "astro";
import { auditError } from "../../../lib/server/audit";
import { getDatabase } from "../../../lib/server/bindings";
import { auditEvent } from "../../../lib/server/audit";
import { createSessionToken, hashPassword, sessionCookie, verifyPassword } from "../../../lib/server/auth";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
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

    interface UserRecord {
      id: string;
      name: string;
      email: string;
      password_hash: string;
      role: string;
      site_id: string | null;
      mfa_required: number;
      mfa_enabled: number;
    }

    const record = await db
      .prepare(
        `SELECT id, name, email, password_hash, role, site_id, mfa_required, mfa_enabled
         FROM users
         WHERE id = ?1 AND is_active = 1
         LIMIT 1`
      )
      .bind(user.id)
      .first() as UserRecord | null;

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

    const token = await createSessionToken({ ...record, force_password_change: 0 } as any);

    await auditEvent(db, request, {
      eventType: "auth.password_change",
      entityType: "user",
      entityId: user.id,
      outcome: "success",
      user
    });

    return json(
      { ok: true, redirectTo: record.mfa_required && !record.mfa_enabled ? "/portal/account/mfa" : "/portal" },
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

    await auditError(db, request, error as Error, { user: user || undefined, metadata: { message: "password change failed" } });     
    return serverError("Password could not be changed.");
  }
};

export const ALL: APIRoute = () => {
  return methodNotAllowed(["POST"]);
};
