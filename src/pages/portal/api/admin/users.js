import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { hashPassword } from "../../../../lib/server/auth.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanBoolean, cleanChoice, cleanEmail, cleanId, cleanText, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

const roles = ["tech", "admin", "client", "finance"];

export async function POST({ request, locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const action = cleanChoice(body.action || "create", "action", ["create", "update", "deactivate"]);

    if (action === "create") {
      const id = crypto.randomUUID();
      const name = cleanText(body.name, "name", { min: 2, max: 160 });
      const email = cleanEmail(body.email, "email");
      const role = cleanChoice(body.role, "role", roles);
      const siteId = cleanId(body.siteId, "siteId", { required: false });
      const password = cleanText(body.password, "password", { min: 14, max: 200 });
      const passwordHash = await hashPassword(password);
      const forcePasswordChange = cleanBoolean(body.forcePasswordChange ?? true);

      await db
        .prepare(
          `INSERT INTO users
             (id, name, email, password_hash, role, site_id, is_active, force_password_change)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7)`
        )
        .bind(id, name, email, passwordHash, role, siteId, forcePasswordChange)
        .run();

      await auditEvent(db, request, {
        eventType: "admin.user.create",
        entityType: "user",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { role, siteId }
      });

      return json({ ok: true, id });
    }

    const id = cleanId(body.id, "id");

    if (action === "deactivate") {
      if (id === locals.user.id) return badRequest("Admins cannot deactivate their own account.");
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

    const name = cleanText(body.name, "name", { min: 2, max: 160 });
    const role = cleanChoice(body.role, "role", roles);
    const siteId = cleanId(body.siteId, "siteId", { required: false });
    const isActive = cleanBoolean(body.isActive);
    const forcePasswordChange = cleanBoolean(body.forcePasswordChange);

    await db
      .prepare(
        `UPDATE users
         SET name = ?1,
             role = ?2,
             site_id = ?3,
             is_active = ?4,
             force_password_change = ?5
         WHERE id = ?6`
      )
      .bind(name, role, siteId, isActive, forcePasswordChange, id)
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
      metadata: { role, siteId, isActive, forcePasswordChange, passwordReset: Boolean(body.password) }
    });

    return json({ ok: true, id });
  } catch (error) {
    if (error.message) return badRequest(error.message);
    console.error("admin users failed", error);
    return serverError("User administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
