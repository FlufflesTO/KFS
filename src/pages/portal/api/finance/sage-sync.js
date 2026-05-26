/**
 * Project Sentinel - Sage Sync Endpoint
 * Purpose: API to trigger pushing a finance task to Sage Accounting
 * Dependencies: cloudflare:workers, Astro, sqlite (D1)
 * Structural Role: API Endpoint Handler
 */

import { getBindings } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit.js";
import { verifyCsrfRequest, csrfErrorResponse } from "../../../../lib/server/csrf.js";
import { forbidden, json, methodNotAllowed, unauthorized } from "../../../../lib/server/http.ts";
import { FinanceService } from "../../../../lib/server/services/finance-service.js";

export const prerender = false;

export async function POST({ request, locals }) {
  const user = locals.user;
  if (!user) return unauthorized();
  
  if (!["finance", "admin"].includes(user.role)) {
    return forbidden("Only finance or admin accounts can sync with Sage.");
  }

  if (!await verifyCsrfRequest(request, user)) {
    return csrfErrorResponse();
  }

  let db, env;
  try {
    const bindings = getBindings();
    db = bindings.db;
    env = bindings.env;
  } catch (error) {
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const body = await request.json();
    const { taskId } = body;
    
    if (!taskId) {
      return json({ ok: false, error: "Task ID is required." }, { status: 400 });
    }

    const financeService = new FinanceService(db);
    await financeService.pushTaskToSage(taskId, env);

    await auditEvent(db, request, {
      eventType: "finance.sage_sync",
      entityType: "finance_task",
      entityId: taskId,
      outcome: "success",
      user,
      metadata: { action: "push_to_sage" }
    });

    return json({ ok: true });
    
  } catch (error) {
    console.error("Sage Sync Error:", error);
    
    await auditEvent(db, request, {
      eventType: "finance.sage_sync",
      entityType: "finance_task",
      entityId: "unknown",
      outcome: "failure",
      user,
      metadata: { error: error instanceof Error ? error.message : String(error) }
    });

    return json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred during Sage synchronization." 
    }, { status: 500 });
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
