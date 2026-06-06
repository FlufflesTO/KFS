/**
 * Project Sentinel - User Session Authentication API
 * Purpose: Handles credentials verification, rate limiting, MFA validation, and session token generation
 * Dependencies: ../../../lib/server/bindings.ts, ../../../lib/server/audit, ../../../lib/server/auth.ts, ../../../lib/server/mfa.js, ../../../lib/server/rateLimit.js, ../../../lib/server/http.ts
 * Structural Role: User login endpoint
 */

import type { APIContext } from "astro";
import type { D1Database } from "@cloudflare/workers-types";
import { getDatabase } from "../../../lib/server/bindings.ts";
import { auditEvent, auditError } from "../../../lib/server/audit";
import { createSessionToken, sessionCookie, verifyPassword, sha256Hex } from "../../../lib/server/auth.js";
import { decryptMfaSecret, verifyTotpCode } from "../../../lib/server/mfa.ts";
import { consumeRateLimit, resetRateLimit } from "../../../lib/server/rateLimit.js";
import { badRequest, json, methodNotAllowed, serverError, tooManyRequests, unauthorized } from "../../../lib/server/http.ts";
import { UserRepository } from "../../../lib/server/db/user-repository.ts";

export const prerender = false;

interface LoginCredentials {
  email?: unknown;
  password?: unknown;
  mfaCode?: unknown;
}


const roleDestinations: Record<string, string> = {
  tech: "/portal/tech/dashboard",
  admin: "/portal/admin/dashboard",
  client: "/portal/client/dashboard",
  finance: "/portal/finance/dashboard",
  manager: "/portal/manager/dashboard"
};

async function readCredentials(request: Request): Promise<LoginCredentials> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = await request.json() as Record<string, unknown>;
    } catch(e) {
      return {
        email: undefined,
        password: undefined,
        mfaCode: undefined
      };
    }
    return {
      email: parsedBody?.email,
      password: parsedBody?.password,
      mfaCode: parsedBody?.mfaCode
    };
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

export async function POST({ request }: APIContext): Promise<Response> {
  let db: D1Database | null = null;
  try {
    const body = await readCredentials(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const mfaCode = String(body.mfaCode || "");

    db = getDatabase();

    if (!email || !password) {
      return badRequest("Email and password are required.");
    }

    // Rate limit by email (5 attempts per 15 min) to block credential stuffing.
    // Also rate limit by IP (10 attempts per 15 min) to block password spraying.
    // The /portal/api/auth path is exempt from middleware auth guards (user is not
    // yet set in locals), so we must enforce rate limits here directly.
    const emailRateLimit = await consumeRateLimit(db!, request, {
      scope: "portal.auth.login",
      subject: email,
      maxAttempts: 5,
      windowSeconds: 900
    });
    if (!emailRateLimit.allowed) {
      await auditEvent(db!, request, {
        eventType: "auth.login",
        entityType: "user",
        entityId: email,
        outcome: "blocked",
        subject: email,
        metadata: { reason: "rate_limited_email", retryAfter: emailRateLimit.retryAfter }
      });
      return tooManyRequests("Too many login attempts. Try again in 15 minutes.", emailRateLimit.retryAfter);
    }

    // IP-scoped bucket to block password spraying across many email addresses
    const ipHash = await sha256Hex(request.headers.get("cf-connecting-ip") || "unknown");
    const ipRateLimit = await consumeRateLimit(db!, request, {
      scope: "portal.auth.login.ip",
      subject: ipHash,
      maxAttempts: 10,
      windowSeconds: 900
    });
    if (!ipRateLimit.allowed) {
      await auditEvent(db!, request, {
        eventType: "auth.login",
        entityType: "user",
        entityId: email,
        outcome: "blocked",
        subject: email,
        metadata: { reason: "rate_limited_ip", retryAfter: ipRateLimit.retryAfter }
      });
      return tooManyRequests("Too many login attempts. Try again in 15 minutes.", ipRateLimit.retryAfter);
    }

    const userRepo = new UserRepository(db!);
    const user = await userRepo.findWithSecretsByEmail(email);

    if (!user) {
      await auditEvent(db!, request, {
        eventType: "auth.login",
        entityType: "user",
        entityId: email,
        outcome: "failure",
        subject: email,
        metadata: { reason: "unknown_user" }
      });
      return unauthorized("Invalid email or password.");
    }

    const userDeletedAt = (user as typeof user & { deleted_at?: string | null }).deleted_at;
    if (!user.is_active || userDeletedAt) {
      await auditEvent(db!, request, {
        eventType: "auth.login",
        entityType: "user",
        entityId: user.id,
        outcome: "failure",
        subject: email,
        metadata: { reason: "inactive_or_deleted" }
      });
      return unauthorized("Invalid email or password.");
    }

    const verified = await verifyPassword(password, user.password_hash);
    if (!verified) {
      await auditEvent(db!, request, {
        eventType: "auth.login",
        entityType: "user",
        entityId: user.id,
        outcome: "failure",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          siteId: user.site_id
        },
        subject: email,
        metadata: { reason: "bad_password" }
      });
      return unauthorized("Invalid email or password.");
    }

    if (user.mfa_enabled) {
      const mfaSecret = user.mfa_secret_encrypted ? await decryptMfaSecret(user.mfa_secret_encrypted) : null;
      const mfaValid = mfaSecret && (await verifyTotpCode(mfaSecret, mfaCode));
      if (!mfaValid) {
        await auditEvent(db!, request, {
          eventType: "auth.mfa",
          entityType: "user",
          entityId: user.id,
          outcome: "failure",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            siteId: user.site_id
          },
          subject: email,
          metadata: { reason: mfaCode ? "bad_code" : "missing_code" }
        });
        return unauthorized(mfaCode ? "Invalid MFA code." : "MFA code is required.");
      }
    }

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      siteId: user.site_id,
      forcePasswordChange: Boolean(user.force_password_change),
      mfaRequired: Boolean(user.mfa_required),
      mfaEnabled: Boolean(user.mfa_enabled)
    });
    
    const destination = user.force_password_change
      ? "/portal/account/password"
      : user.mfa_required && !user.mfa_enabled
        ? "/portal/account/mfa"
        : roleDestinations[user.role] || "/portal/login";

    await resetRateLimit(db!, request, { 
      scope: "portal.login", 
      subject: email,
      maxAttempts: 5,
      windowSeconds: 300
    });
    await db!.prepare(`UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1`).bind(user.id).run();
    await auditEvent(db!, request, {
      eventType: "auth.login",
      entityType: "user",
      entityId: user.id,
      outcome: "success",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        siteId: user.site_id
      },
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("AUTH_API_ERROR:", errorMessage);
    console.error("AUTH_API_ERROR_STACK:", errorStack);
    
    if (db) {
      try {
        await auditError(db, request, error as Error, {
          entityType: "portal_api",
          entityId: "auth_login"
        });
      } catch (auditErr) {
        console.error("Failed to audit auth error:", auditErr);
      }
    } else {
      console.error("Database connection was not established for error auditing");
      // Try to get DB again to see what's wrong
      try {
        const testDb = getDatabase();
        console.log("Database obtained successfully after error:", !!testDb);
      } catch (dbErr) {
        console.error("Database binding issue:", dbErr instanceof Error ? dbErr.message : String(dbErr));
      }
    }
    return serverError("Authentication could not be completed.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
