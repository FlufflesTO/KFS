import type { APIRoute } from "astro";
import { auditError } from "../../../../lib/server/audit";
import { getDatabase } from "../../../../lib/server/bindings";
import { auditEvent } from "../../../../lib/server/audit";
import { hashPassword } from "../../../../lib/server/auth";
import { createResetToken, resetTokenExpiry, sha256Hex } from "../../../../lib/server/auth";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http";
import { cleanBoolean, cleanChoice, cleanEmail, cleanId, cleanText, readJson, requireAdmin } from "../../../../lib/server/access";

export const prerender = false;

const roles = ["tech", "admin", "client", "finance"];
const mfaEligibleRoles = ["admin", "finance", "tech"];

export const POST: APIRoute = async ({ request, locals }) => {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  let db: ReturnType<typeof getDatabase> | null = null;
  try {
    db = getDatabase();

    const body = await readJson(request) as Record<string, any>;
    const action = cleanChoice(body.action || "create", "action", ["create", "update", "deactivate", "reset-link", "reset-mfa"]);

    if (action === "create") {
      const id = crypto.randomUUID();
      const name = cleanText(body.name, "name", { min: 2, max: 160 });
      const email = cleanEmail(body.email, "email");
      const role = cleanChoice(body.role, "role", roles);
      const siteId = cleanId(body.siteId, "siteId", { required: false });
      const password = cleanText(body.password, "password", { min: 14, max: 200 });
      const passwordHash = await hashPassword(password);
      const forcePasswordChange = cleanBoolean(body.forcePasswordChange ?? true);
      const mfaRequired = mfaEligibleRoles.includes(role) ? cleanBoolean(body.mfaRequired) : 0;

      await db
        .prepare(
          `INSERT INTO users
             (id, name, email, password_hash, role, site_id, is_active, force_password_change, mfa_required)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8)`
        )
        .bind(id, name, email, passwordHash, role, siteId, forcePasswordChange, mfaRequired)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.user.create",
        entityType: "user",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { role, siteId, mfaRequired: Boolean(mfaRequired) }
      });

      return json({ ok: true, id });
    }

    const id = cleanId(body.id, "id");
    if (!id) return badRequest("id is required.");

    if (action === "deactivate") {
      if (id === locals.user!.id) return badRequest("Admins cannot deactivate their own account.");
      await db.prepare(`UPDATE users SET is_active = 0 WHERE id = ?1`).bind(id).run();
      await auditEvent(db, request, {
        eventType: "admin.user.deactivate",
        entityType: "user",
        entityId: id,
        outcome: "success",
        user: locals.user
      });
      return json({ ok: true, id });
    }

    if (action === "reset-link") {
      interface TargetUser {
        id: string;
        email: string;
        is_active: number;
      }
      const target = await db.prepare(`SELECT id, email, is_active FROM users WHERE id = ?1 LIMIT 1`).bind(id).first() as TargetUser | null;
      if (!target || !target.is_active) return badRequest("Only active users can receive password reset links.");

      const token = createResetToken();
      const tokenHash = await sha256Hex(token);
      const resetId = crypto.randomUUID();
      const expiresAt = resetTokenExpiry(1);

      await db
        .prepare(
          `INSERT INTO password_reset_tokens
             (id, user_id, token_hash, expires_at, created_by_user_id)
           VALUES
             (?1, ?2, ?3, ?4, ?5)`
        )
        .bind(resetId, id, tokenHash, expiresAt, locals.user!.id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.user.reset_link",
        entityType: "user",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { expiresAt }
      });

      const url = new URL(request.url);
      const resetUrl = `${url.origin}/portal/reset?token=${encodeURIComponent(token)}`;
      return json({ ok: true, id, resetUrl, expiresAt });
    }

    if (action === "reset-mfa") {
      interface TargetUser {
        id: string;
        role: string;
        is_active: number;
      }
      const target = await db.prepare(`SELECT id, role, is_active FROM users WHERE id = ?1 LIMIT 1`).bind(id).first() as TargetUser | null;
      if (!target || !target.is_active) return badRequest("Only active users can have MFA reset.");
      if (!mfaEligibleRoles.includes(target.role)) return badRequest("MFA reset is limited to admin, finance and technician accounts.");

      await db
        .prepare(
          `UPDATE users
           SET mfa_enabled = 0,
               mfa_secret_encrypted = NULL,
               mfa_enabled_at = NULL
           WHERE id = ?1`
        )
        .bind(id)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.user.mfa_reset",
        entityType: "user",
        entityId: id,
        outcome: "success",
        user: locals.user
      });

      return json({ ok: true, id });
    }

    const name = cleanText(body.name, "name", { min: 2, max: 160 });
    const role = cleanChoice(body.role, "role", roles);
    const siteId = cleanId(body.siteId, "siteId", { required: false });
    const isActive = cleanBoolean(body.isActive);
    const forcePasswordChange = cleanBoolean(body.forcePasswordChange);
    const mfaRequired = mfaEligibleRoles.includes(role) ? cleanBoolean(body.mfaRequired) : 0;

    await db
      .prepare(
        `UPDATE users
         SET name = ?1,
             role = ?2,
             site_id = ?3,
             is_active = ?4,
             force_password_change = ?5,
             mfa_required = ?6
         WHERE id = ?7`
      )
      .bind(name, role, siteId, isActive, forcePasswordChange, mfaRequired, id)
      .run();

    if (body.password) {
      const password = cleanText(body.password, "password", { min: 14, max: 200 });
      await db
        .prepare(`UPDATE users SET password_hash = ?1, force_password_change = 1 WHERE id = ?2`)
        .bind(await hashPassword(password), id)
        .run();
    }

    await auditEvent(db, request, {
      eventType: "admin.user.update",
      entityType: "user",
      entityId: id,
      outcome: "success",
      user: locals.user,
      metadata: { role, siteId, isActive, forcePasswordChange, mfaRequired: Boolean(mfaRequired), passwordReset: Boolean(body.password) }
    });

    return json({ ok: true, id });
  } catch (error) {
    if (error instanceof Error && error.message) return badRequest(error instanceof Error ? error.message : "Unknown error");
    if (db) {
      await auditError(db, request, error as Error, { user: locals.user || undefined, metadata: { message: "admin users failed" } });
    }
    return serverError("User administration failed.");
  }
};

export const ALL: APIRoute = () => {
  return methodNotAllowed(["POST"]);
};
