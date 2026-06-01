/**
 * Project Sentinel - Cloudflare Workers Bindings
 * Purpose: Provides type-safe access to database and storage bindings and standard fee config
 * Dependencies: @cloudflare/workers-types
 * Structural Role: Server-side bindings and configuration accessor
 * 
 * Note: Cloudflare Pages SSR with Astro uses cloudflare:workers module for bindings
 */

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
// @ts-ignore - cloudflare:workers is a Cloudflare runtime module
import { env } from "cloudflare:workers";

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
function resolveBindings(): Env {
  try {
    // Use cloudflare:workers module (the correct way for Pages/Workers)
    const runtimeEnv = env as Env | undefined;
    if (runtimeEnv && (runtimeEnv.DB || runtimeEnv.STORAGE || runtimeEnv.SESSION_SECRET || runtimeEnv.MFA_SECRET)) {
      return runtimeEnv;
    }
  } catch (e) {
    // Module not available in this context
  }
  
  // Fallback patterns for development or alternative runtimes
  if (typeof globalThis !== "undefined") {
    const gh = globalThis as Record<string, unknown>;
    const astroLocals = gh.__astro_locals__ as Record<string, unknown> | undefined;
    if (astroLocals?.db) return astroLocals as unknown as Env;
    if (gh.DB || gh.STORAGE) return gh as unknown as Env;
    const envObj = gh.env as Record<string, unknown> | undefined;
    if (envObj?.DB || envObj?.STORAGE) return envObj as unknown as Env;
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
  const raw = String(bindings.STANDARD_SERVICE_FEE || "1850.00");
  const configured = Number(raw);
  if (Number.isFinite(configured) && configured >= 0) {
    if (raw.includes(".") || configured < 100000) {
      return Math.round(configured * 100);
    }
    return Math.round(configured);
  }
  return 185000;
}
