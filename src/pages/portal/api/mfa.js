import { auditError } from "../../../lib/server/audit.js";
import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { createSessionToken, sessionCookie, revokeSessionToken, sessionCookieName } from "../../../lib/server/auth.js";
import { decryptMfaSecret, encryptMfaSecret, generateTotpSecret, mfaProvisioningUri, verifyTotpCode } from "../../../lib/server/mfa.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

const destinations = {
  tech: "/portal/tech/dashboard",
  admin: "/portal/admin/dashboard",
  client: "/portal/client/dashboard",
  finance: "/portal/finance/dashboard"
};

async function currentUserRecord(db, user) {
  return db
    .prepare(
      `SELECT id, name, email, role, site_id, mfa_required, mfa_enabled, mfa_secret_encrypted, force_password_change
       FROM users
       WHERE id = ?1 AND is_active = 1
       LIMIT 1`
    )
    .bind(user.id)
    .first();
}

export async function POST({ request, locals }) {
  const user = locals.user;
  if (!user) return unauthorized();

  const db = getDatabase();

  try {
    const body = await request.json();
    const action = String(body.action || "").trim();
    const record = await currentUserRecord(db, user);
    if (!record) return forbidden("This account is not available.");

    if (action === "setup") {
      if (!["admin", "finance", "tech"].includes(record.role)) {
        return forbidden("MFA setup is currently limited to admin, finance, and tech accounts.");
      }
      if (record.mfa_enabled) return badRequest("MFA is already enabled for this account.");

      const secret = generateTotpSecret();
      await auditEvent(db, request, {
        eventType: "auth.mfa_setup_start",
        entityType: "user",
        entityId: record.id,
        outcome: "success",
        user
      });
      return json({
        ok: true,
        secret,
        provisioningUri: mfaProvisioningUri(record, secret)
      });
    }

    if (action === "enable") {
      if (!["admin", "finance", "tech"].includes(record.role)) {
        return forbidden("MFA setup is currently limited to admin, finance, and tech accounts.");
      }
      if (record.mfa_enabled) return badRequest("MFA is already enabled for this account.");

      const secret = String(body.secret || "").replaceAll(" ", "").trim().toUpperCase();
      const code = String(body.code || "").trim();
      if (!/^[A-Z2-7]{16,64}$/.test(secret)) return badRequest("MFA secret is invalid.");
      if (!(await verifyTotpCode(secret, code))) {
        await auditEvent(db, request, {
          eventType: "auth.mfa_enable",
          entityType: "user",
          entityId: record.id,
          outcome: "failure",
          user,
          metadata: { reason: "bad_code" }
        });
        return badRequest("Authenticator code is invalid.");
      }

      await db
        .prepare(
          `UPDATE users
           SET mfa_enabled = 1,
               mfa_required = CASE WHEN role IN ('admin', 'finance', 'tech') THEN 1 ELSE mfa_required END,
               mfa_secret_encrypted = ?1,
               mfa_enabled_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?2`
        )
        .bind(await encryptMfaSecret(secret), record.id)
        .run();

      await auditEvent(db, request, {
        eventType: "auth.mfa_enable",
        entityType: "user",
        entityId: record.id,
        outcome: "success",
        user
      });

      const refreshed = await currentUserRecord(db, user);
      
      // Revoke the old session token to prevent session fixation
      const oldToken = request.headers.get("cookie")?.split("; ").find(c => c.startsWith(`${sessionCookieName}=`))?.split("=")[1];
      if (oldToken) {
        await revokeSessionToken(db, oldToken);
      }

      const token = await createSessionToken(refreshed);
      return json(
        { ok: true, redirectTo: destinations[refreshed.role] || "/portal" },
        { headers: { "Set-Cookie": sessionCookie(token) } }
      );
    }

    if (action === "disable") {
      if (!record.mfa_enabled) return json({ ok: true, redirectTo: "/portal/account/mfa" });
      const secret = await decryptMfaSecret(record.mfa_secret_encrypted);
      const code = String(body.code || "").trim();
      if (!secret || !(await verifyTotpCode(secret, code))) {
        await auditEvent(db, request, {
          eventType: "auth.mfa_disable",
          entityType: "user",
          entityId: record.id,
          outcome: "failure",
          user,
          metadata: { reason: "bad_code" }
        });
        return badRequest("Authenticator code is invalid.");
      }

      await db
        .prepare(
          `UPDATE users
           SET mfa_enabled = 0,
               mfa_secret_encrypted = NULL,
               mfa_enabled_at = NULL
           WHERE id = ?1`
        )
        .bind(record.id)
        .run();

      await auditEvent(db, request, {
        eventType: "auth.mfa_disable",
        entityType: "user",
        entityId: record.id,
        outcome: "success",
        user
      });

      const refreshed = await currentUserRecord(db, user);
      const token = await createSessionToken(refreshed);
      return json({ ok: true, redirectTo: "/portal/account/mfa" }, { headers: { "Set-Cookie": sessionCookie(token) } });
    }

    return badRequest("MFA action is invalid.");
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest("Request body must be valid JSON.");
    if (error.message?.includes("MFA_SECRET") || error.name === "OperationError") {
      await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "mfa configuration failed" } });
      return serverError("MFA could not be completed.");
    }
    await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, error, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "mfa action failed" } });
    return serverError("MFA could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
