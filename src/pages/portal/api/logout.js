import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { expiredSessionCookie } from "../../../lib/server/auth.js";
import { expiredCsrfCookie } from "../../../lib/server/csrf.js";
import { json, methodNotAllowed } from "../../../lib/server/http.js";

export const prerender = false;

export async function POST({ request, locals }) {
  const db = getDatabase();
  const user = locals.user || null;

  if (user) {
    await auditEvent(db, request, {
      eventType: "auth.logout",
      entityType: "user",
      entityId: user.id,
      outcome: "success",
      user
    });
  }

  const response = json({ ok: true, redirectTo: "/portal/login" });
  response.headers.append("Set-Cookie", expiredSessionCookie());
  response.headers.append("Set-Cookie", expiredCsrfCookie());
  return response;
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
