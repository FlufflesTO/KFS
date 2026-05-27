/**
 * Project Sentinel - Sage Status & Disconnect Endpoint
 * Purpose: Provides integration connection status check and disconnect capability
 * Dependencies: cloudflare:workers, Astro, sqlite (D1)
 * Structural Role: API Endpoint Handler
 */

import { getBindings } from "../../../../lib/server/bindings.ts";
import { getSageConnectionStatus, disconnectSage } from "../../../../lib/server/sage.js";
import { auditEvent } from "../../../../lib/server/audit";
import { verifyCsrfRequest, csrfErrorResponse } from "../../../../lib/server/csrf.js";
import { forbidden, json, methodNotAllowed, unauthorized } from "../../../../lib/server/http.ts";

export const prerender = false;

export async function GET({ locals }) {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!["finance", "admin"].includes(user.role)) {
    return forbidden("Only finance or admin accounts can view Sage status.");
  }

  let db;
  try {
    db = getBindings().db;
  } catch (error) {
    return new Response("Server configuration error", { status: 500 });
  }

  const status = await getSageConnectionStatus(db);
  return json({ ok: true, ...status });
}

export async function POST({ request, locals }) {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!["finance", "admin"].includes(user.role)) {
    return forbidden("Only finance or admin accounts can manage Sage status.");
  }

  if (!await verifyCsrfRequest(request, user)) {
    return csrfErrorResponse();
  }

  let db;
  try {
    db = getBindings().db;
  } catch (error) {
    return new Response("Server configuration error", { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.action === "disconnect") {
    await disconnectSage(db);

    await auditEvent(db, request, {
      eventType: "finance.sage_disconnect",
      entityType: "integration",
      entityId: "sage",
      outcome: "success",
      user
    });

    return json({ ok: true, connected: false });
  }

  return json({ ok: false, error: "Invalid action." }, { status: 400 });
}

export function ALL() {
  return methodNotAllowed(["GET", "POST"]);
}
