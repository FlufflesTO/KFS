/**
 * Offline mutation idempotency helpers.
 * Purpose: prevents duplicate queue replay from creating duplicate business records.
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { SessionUser } from "./auth";
import { sha256Hex } from "./auth";

export interface IdempotencyRecord {
  id: string;
  idempotency_key: string;
  request_hash: string;
  status: "accepted" | "applied" | "conflict" | "failed";
  response_status: number | null;
}

export interface IdempotencyStartResult {
  state: "new" | "duplicate" | "conflict";
  id: string;
  record?: IdempotencyRecord;
}

export async function requestHash(body: string | null | undefined): Promise<string> {
  return sha256Hex(body || "");
}

export async function startIdempotentMutation(
  db: D1Database,
  params: {
    idempotencyKey: string;
    mutationType: "queued_request" | "jobcard_draft";
    targetPath: string;
    body: string | null;
    user: SessionUser;
  }
): Promise<IdempotencyStartResult> {
  const hash = await requestHash(params.body);
  const existing = await db
    .prepare(
      `SELECT id, idempotency_key, request_hash, status, response_status
       FROM offline_mutations
       WHERE idempotency_key = ?1
       LIMIT 1`
    )
    .bind(params.idempotencyKey)
    .first<IdempotencyRecord>();

  if (existing) {
    if (existing.request_hash !== hash) {
      await db
        .prepare(
          `UPDATE offline_mutations
           SET status = 'conflict', conflict_reason = 'Idempotency key reused with a different payload.'
           WHERE id = ?1`
        )
        .bind(existing.id)
        .run();
      return { state: "conflict", id: existing.id, record: existing };
    }
    return { state: "duplicate", id: existing.id, record: existing };
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO offline_mutations
         (id, idempotency_key, actor_user_id, actor_role, mutation_type, target_path, request_hash, request_body_json, status)
       VALUES
         (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'accepted')`
    )
    .bind(
      id,
      params.idempotencyKey,
      params.user.id,
      params.user.role,
      params.mutationType,
      params.targetPath,
      hash,
      params.body
    )
    .run();

  return { state: "new", id };
}

export async function finishIdempotentMutation(
  db: D1Database,
  id: string,
  status: "applied" | "failed",
  responseStatus: number,
  conflictReason: string | null = null
): Promise<void> {
  await db
    .prepare(
      `UPDATE offline_mutations
       SET status = ?1, response_status = ?2, conflict_reason = ?3
       WHERE id = ?4`
    )
    .bind(status, responseStatus, conflictReason, id)
    .run();
}
