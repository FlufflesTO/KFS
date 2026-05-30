/**
 * Project Sentinel - Cloudflare Workers Bindings
 * Purpose: Provides type-safe access to database and storage bindings and standard fee config
 * Dependencies: @cloudflare/workers-types
 * Structural Role: Server-side bindings and configuration accessor
 * 
 * Note: In Cloudflare Pages + Astro SSR, bindings are available on the global object
 * at request time. We try multiple access patterns to ensure compatibility.
 */

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface WorkerBindings {
  db: D1Database;
  storage: R2Bucket;
  env: Env;
}

export interface Env {
  SESSION_SECRET: string;
  MFA_SECRET: string;
  DB?: D1Database;
  STORAGE?: R2Bucket;
  STANDARD_SERVICE_FEE?: string;
  SAGE_CLIENT_ID?: string;
  SAGE_CLIENT_SECRET?: string;
  SAGE_REDIRECT_URI?: string;
  ENVIRONMENT?: string;
  [key: string]: unknown;
}

function resolveBindings(): any {
  // Pattern 1: Check for Astro.locals injection (from middleware)
  // This is set by the middleware when running in Cloudflare Pages SSR
  if (typeof globalThis !== "undefined") {
    const gh = globalThis as any;
    // Check if bindings were injected by middleware into a shared location
    if (gh.__astro_locals__?.db || gh.__astro_locals__?.storage) {
      return gh.__astro_locals__;
    }
  }
  
  // Pattern 2: Check Cloudflare's runtime global (for Pages Functions)
  if (typeof __env__ !== "undefined" && (__env__.DB || __env__.STORAGE)) {
    return __env__;
  }
  
  // Pattern 3: Check globalThis.env (for Workers)
  if (typeof globalThis !== "undefined" && (globalThis as any).env) {
    const env = (globalThis as any).env;
    if (env.DB || env.STORAGE) {
      return env;
    }
  }
  
  // Pattern 4: Check globalThis directly (fallback)
  if (typeof globalThis !== "undefined") {
    const gh = globalThis as any;
    if (gh.DB || gh.STORAGE) {
      return gh;
    }
  }
  
  // Pattern 5: Return empty object (will cause error if bindings are used)
  return {};
}

/**
 * Set bindings from Astro middleware context.
 * Called by middleware to inject bindings into module scope.
 */
export function setBindingsFromLocals(locals: any): void {
  if (typeof globalThis !== "undefined") {
    (globalThis as any).__astro_locals__ = {
      DB: locals.db,
      STORAGE: locals.storage,
      env: locals.env
    };
  }
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
