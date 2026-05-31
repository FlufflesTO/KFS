import type { APIRoute } from "astro";
import { auditError } from "../../../lib/server/audit";
import { getDatabase } from "../../../lib/server/bindings";
import { auditEvent } from "../../../lib/server/audit";
import { hashPassword } from "../../../lib/server/auth";
import { consumeRateLimit } from "../../../lib/server/rateLimit";
import { sha256Hex } from "../../../lib/server/auth";
import { badRequest, json, methodNotAllowed, serverError, tooManyRequests } from "../../../lib/server/http";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let db: ReturnType<typeof getDatabase> | null = null;
  try {
    db = getDatabase();

    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    const token = String(body.token || "").trim();
    const password = String(body.password || "");

    const limit = await consumeRateLimit(db, request, {
      scope: "portal.password_reset",
      subject: token ? await sha256Hex(token).then((hash) => hash.slice(0, 16)) : "missing-token",
      maxAttempts: 8,
      windowSeconds: 15 * 60
    });
    if (!limit.allowed) return tooManyRequests("Too many reset attempts. Try again later.", limit.retryAfter);

    if (!/^[A-Za-z0-9_-]{32,120}$/.test(token)) {
      return badRequest("Reset link is invalid or expired.");
    }

    if (password.length < 14 || password.length > 200) {
      return badRequest("Password must be between 14 and 200 characters.");
    }

    const tokenHash = await sha256Hex(token);
    interface ResetRecord {
      id: string;
      user_id: string;
      expires_at: string;
      used_at: string | null;
      email: string;
      is_active: number;
    }

    const reset = await db
      .prepare(
        `SELECT password_reset_tokens.id, password_reset_tokens.user_id, password_reset_tokens.expires_at,
                password_reset_tokens.used_at, users.email, users.is_active
         FROM password_reset_tokens
         INNER JOIN users ON users.id = password_reset_tokens.user_id
         WHERE password_reset_tokens.token_hash = ?1
         LIMIT 1`
      )
      .bind(tokenHash)
      .first() as ResetRecord | null;

    if (!reset || reset.used_at || reset.expires_at <= new Date().toISOString() || !reset.is_active) {
      await auditEvent(db, request, {
        eventType: "auth.password_reset",
        entityType: "password_reset_token",
        entityId: reset?.id || "unknown",
        outcome: "failure",
        subject: tokenHash.slice(0, 16),
        metadata: { reason: "invalid_or_expired" }
      });
      return badRequest("Reset link is invalid or expired.");
    }

    await db.batch([
      db
        .prepare(
          `UPDATE users
           SET password_hash = ?1,
               force_password_change = 1,
               password_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?2`
        )
        .bind(await hashPassword(password), reset.user_id),
      db
        .prepare(`UPDATE password_reset_tokens SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1`)
        .bind(reset.id)
    ]);

    await auditEvent(db, request, {
      eventType: "auth.password_reset",
      entityType: "user",
      entityId: reset.user_id,
      outcome: "success",
      subject: reset.email
    });

    return json({ ok: true, redirectTo: "/portal/login" });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest("Request body must be valid JSON.");
    if (db) {
      await auditError(db, request, error as Error, { metadata: { message: "password reset failed" } });
    }
    return serverError("Password reset could not be completed.");
  }
};

export const ALL: APIRoute = () => {
  return methodNotAllowed(["POST"]);
};
