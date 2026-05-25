import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent, auditError } from "../../../lib/server/audit.js";
import { createSessionToken, sessionCookie, verifyPassword } from "../../../lib/server/auth.js";
import { decryptMfaSecret, verifyTotpCode } from "../../../lib/server/mfa.js";
import { consumeRateLimit, resetRateLimit } from "../../../lib/server/rateLimit.js";
import { badRequest, json, methodNotAllowed, serverError, tooManyRequests, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

const roleDestinations = {
  tech: "/portal/tech/dashboard",
  admin: "/portal/admin/dashboard",
  client: "/portal/client/dashboard",
  finance: "/portal/finance/dashboard"
};

async function readCredentials(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      email: form.get("email"),
      password: form.get("password"),
      mfaCode: form.get("mfaCode")
    };
  }

  return {};
}

export async function POST({ request }) {
  try {
    const body = await readCredentials(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const mfaCode = String(body.mfaCode || "");
    const db = getDatabase();

    if (!email || !password) {
      return badRequest("Email and password are required.");
    }

    const rateLimit = await consumeRateLimit(db, request, {
      scope: "portal.login",
      subject: email,
      maxAttempts: 8,
      windowSeconds: 15 * 60
    });

    if (!rateLimit.allowed) {
      await auditEvent(db, request, {
        eventType: "auth.rate_limited",
        entityType: "user",
        entityId: email,
        outcome: "blocked",
        subject: email,
        metadata: { attempts: rateLimit.attempts, retryAfter: rateLimit.retryAfter }
      });
      return tooManyRequests("Too many sign-in attempts. Try again later.", rateLimit.retryAfter);
    }

    const user = await db
      .prepare(
        `SELECT id, name, email, password_hash, role, site_id, force_password_change,
                mfa_required, mfa_enabled, mfa_secret_encrypted
         FROM users
         WHERE email = ?1 AND is_active = 1
         LIMIT 1`
      )
      .bind(email)
      .first();

    if (!user) {
      await auditEvent(db, request, {
        eventType: "auth.login",
        entityType: "user",
        entityId: email,
        outcome: "failure",
        subject: email,
        metadata: { reason: "unknown_user" }
      });
      return unauthorized("Invalid email or password.");
    }

    const verified = await verifyPassword(password, user.password_hash);
    if (!verified) {
      await auditEvent(db, request, {
        eventType: "auth.login",
        entityType: "user",
        entityId: user.id,
        outcome: "failure",
        user,
        subject: email,
        metadata: { reason: "bad_password" }
      });
      return unauthorized("Invalid email or password.");
    }

    if (user.mfa_enabled) {
      const mfaSecret = await decryptMfaSecret(user.mfa_secret_encrypted);
      const mfaValid = mfaSecret && (await verifyTotpCode(mfaSecret, mfaCode));
      if (!mfaValid) {
        await auditEvent(db, request, {
          eventType: "auth.mfa",
          entityType: "user",
          entityId: user.id,
          outcome: "failure",
          user,
          subject: email,
          metadata: { reason: mfaCode ? "bad_code" : "missing_code" }
        });
        return unauthorized(mfaCode ? "Invalid MFA code." : "MFA code is required.");
      }
    }

    const token = await createSessionToken(user);
    const destination = user.force_password_change
      ? "/portal/account/password"
      : user.mfa_required && !user.mfa_enabled
        ? "/portal/account/mfa"
        : roleDestinations[user.role] || "/portal/login";

    await resetRateLimit(db, request, { scope: "portal.login", subject: email });
    await db.prepare(`UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1`).bind(user.id).run();
    await auditEvent(db, request, {
      eventType: "auth.login",
      entityType: "user",
      entityId: user.id,
      outcome: "success",
      user,
      subject: email,
      metadata: { redirectTo: destination }
    });

    return json(
      {
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          siteId: user.site_id || null,
          forcePasswordChange: Boolean(user.force_password_change),
          mfaRequired: Boolean(user.mfa_required),
          mfaEnabled: Boolean(user.mfa_enabled)
        },
        redirectTo: destination
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie(token)
        }
      }
    );
  } catch (error) {
    await auditError(db, request, error, {
      entityType: "portal_api",
      entityId: "auth_login"
    });
    return serverError("Authentication could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
