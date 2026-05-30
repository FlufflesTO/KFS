/**
 * Offline Sync API
 * Purpose: receives recoverable offline portal drafts and records idempotency keys for replay safety.
 */

import type { APIContext } from "astro";
import { z } from "zod";
import { auditError, auditEvent } from "../../../lib/server/audit";
import { getDatabase } from "../../../lib/server/bindings";
import { verifyCsrfRequest } from "../../../lib/server/csrf";
import { finishIdempotentMutation, startIdempotentMutation } from "../../../lib/server/idempotency";

export const prerender = false;

const OfflineSyncSchema = z.object({
  type: z.literal("jobcard_draft"),
  idempotencyKey: z.string().min(16).max(160).regex(/^[A-Za-z0-9:_-]+$/),
  jobId: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/),
  payload: z.record(z.string(), z.unknown()),
  clientUpdatedAt: z.number().int().positive()
});

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  const user = locals.user;
  if (!user || !["admin", "tech"].includes(user.role)) {
    return json({ ok: false, message: "Unauthorized." }, 403);
  }

  const db = getDatabase();

  if (!(await verifyCsrfRequest(request, user))) {
    return json({ ok: false, message: "Invalid CSRF token." }, 403);
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
    const parsed = OfflineSyncSchema.safeParse(JSON.parse(bodyText));
    if (!parsed.success) {
      return json({ ok: false, message: parsed.error.issues[0]?.message || "Invalid offline sync payload." }, 400);
    }

    const mutation = await startIdempotentMutation(db, {
      idempotencyKey: parsed.data.idempotencyKey,
      mutationType: "jobcard_draft",
      targetPath: `/portal/jobs/${parsed.data.jobId}/draft`,
      body: bodyText,
      user
    });

    if (mutation.state === "conflict") {
      return json({
        ok: false,
        conflict: true,
        mutationId: mutation.id,
        message: "This offline draft conflicts with an existing replay key."
      }, 409);
    }

    if (mutation.state === "duplicate") {
      return json({
        ok: true,
        duplicate: true,
        mutationId: mutation.id,
        message: "Offline draft was already received."
      });
    }

    await finishIdempotentMutation(db, mutation.id, "applied", 202);
    await auditEvent(db, request, {
      eventType: "offline.draft_sync",
      entityType: "job",
      entityId: parsed.data.jobId,
      outcome: "success",
      user,
      subject: user.email,
      metadata: {
        mutationId: mutation.id,
        clientUpdatedAt: parsed.data.clientUpdatedAt
      }
    });

    return json({
      ok: true,
      mutationId: mutation.id,
      message: "Offline draft recovered for server-side review."
    }, 202);
  } catch (error) {
    await auditError(db, request, error, { user, metadata: { message: "offline sync failed" } });
    return json({ ok: false, message: "Offline sync failed." }, 500);
  }
}
