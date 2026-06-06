/**
 * Project Sentinel - Cloudflare Workers Bindings
 * Purpose: Provides type-safe access to database and storage bindings and standard fee config
 * Dependencies: cloudflare:workers, @cloudflare/workers-types
 * Structural Role: Server-side bindings and configuration accessor
 *
 * Binding access model (Astro 6 + @astrojs/cloudflare v13, Workers target):
 *   The portal deploys as a Cloudflare Worker, so bindings (D1 `DB`, R2 `STORAGE`)
 *   and secrets are read directly from the `cloudflare:workers` runtime `env`.
 *   `astro dev` under v13 runs the real `workerd` runtime, so the same import
 *   resolves locally from `.dev.vars` + `wrangler.portal.jsonc` — no Pages shims.
 *   A `process.env` fallback covers non-worker contexts (e.g. CLI scripts).
 */

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
// @ts-ignore - cloudflare:workers is a Cloudflare runtime virtual module provided by the adapter
import { env as workerEnv } from "cloudflare:workers";

export interface WorkerBindings {
  db: D1Database;
  storage: R2Bucket;
  env: Env;
}

export interface Env {
  SESSION_SECRET: string;
  MFA_SECRET: string;
  CSRF_SECRET?: string;
  ENCRYPTION_SECRET?: string;
  DB?: D1Database;
  STORAGE?: R2Bucket;
  STANDARD_SERVICE_FEE?: string;
  SAGE_CLIENT_ID?: string;
  SAGE_CLIENT_SECRET?: string;
  SAGE_REDIRECT_URI?: string;
  ENVIRONMENT?: string;
  [key: string]: unknown;
}

/**
 * Resolves Cloudflare bindings from the runtime environment.
 *
 * Resolution order:
 * 1. `cloudflare:workers` runtime `env` — canonical for Workers + `astro dev` (workerd).
 *    Property access here is I/O-free; binding *methods* are only ever called inside a
 *    request context by callers, which Workers permits.
 * 2. `process.env` — local tooling / CLI scripts where the workerd env is absent.
 */
function resolveBindings(): Env {
  const runtime = workerEnv as Env | undefined;
  if (runtime && (runtime.DB || runtime.STORAGE || runtime.SESSION_SECRET || runtime.MFA_SECRET)) {
    return runtime;
  }

  if (typeof process !== "undefined" && process.env) {
    return {
      SESSION_SECRET: process.env.SESSION_SECRET || "",
      MFA_SECRET: process.env.MFA_SECRET || "",
      ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || "",
      ENVIRONMENT: process.env.ENVIRONMENT || "local",
      STANDARD_SERVICE_FEE: process.env.STANDARD_SERVICE_FEE || "185000"
    } as Env;
  }

  return {} as Env;
}

export function getBindings(): WorkerBindings {
  const bindings = resolveBindings();

  const db = bindings.DB as D1Database | undefined;
  const storage = bindings.STORAGE as R2Bucket | undefined;

  if (!db) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }

  if (!storage) {
    throw new Error("Cloudflare R2 binding STORAGE is not configured.");
  }

  return { db, storage, env: bindings };
}

export function getDatabase(): D1Database {
  const bindings = resolveBindings();
  const db = bindings.DB as D1Database | undefined;

  if (!db) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }

  return db;
}

export function getStorage(): R2Bucket {
  const bindings = resolveBindings();
  const storage = bindings.STORAGE as R2Bucket | undefined;

  if (!storage) {
    throw new Error("Cloudflare R2 binding STORAGE is not configured.");
  }

  return storage;
}

export function getStandardServiceFee(): number {
  const bindings = resolveBindings();
  const raw = String(bindings.STANDARD_SERVICE_FEE || "185000");
  const configured = Number(raw);
  if (Number.isFinite(configured) && configured >= 0) {
    if (raw.includes(".") || configured < 100000) {
      return Math.round(configured * 100);
    }
    return Math.round(configured);
  }
  return 185000;
}
