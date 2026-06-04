/**
 * Project Sentinel - Cloudflare Workers Bindings
 * Purpose: Provides type-safe access to database and storage bindings and standard fee config
 * Dependencies: @cloudflare/workers-types
 * Structural Role: Server-side bindings and configuration accessor
 *
 * Note: Cloudflare Pages SSR with Astro injects bindings into the function context.
 * This module provides a unified way to access them across local and production environments.
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
 * Binding resolution order:
 * 1. Cloudflare Pages function context (globalThis.__env__)
 * 2. Astro locals fallback (__astro_locals__)
 * 3. Direct globalThis properties
 * 4. Process environment variables (local development)
 */
function resolveBindings(): Env {
  // Try Cloudflare Pages SSR context first
  if (typeof globalThis !== "undefined") {
    const gh = globalThis as Record<string, unknown>;
    
    // Cloudflare Pages injects env vars into globalThis.__env__
    const pagesEnv = gh.__env__ as Env | undefined;
    if (pagesEnv && (pagesEnv.DB || pagesEnv.STORAGE || pagesEnv.SESSION_SECRET)) {
      return pagesEnv;
    }
    
    // Astro Cloudflare adapter may use __astro_locals__
    const astroLocals = gh.__astro_locals__ as Record<string, unknown> | undefined;
    if (astroLocals && (astroLocals.db || astroLocals.DB)) {
      return {
        DB: (astroLocals.db || astroLocals.DB) as D1Database,
        STORAGE: (astroLocals.storage || astroLocals.STORAGE) as R2Bucket,
        SESSION_SECRET: (astroLocals.SESSION_SECRET as string) || process.env.SESSION_SECRET || "",
        MFA_SECRET: (astroLocals.MFA_SECRET as string) || process.env.MFA_SECRET || "",
        ENCRYPTION_SECRET: (astroLocals.ENCRYPTION_SECRET as string) || process.env.ENCRYPTION_SECRET || "",
        ENVIRONMENT: (astroLocals.ENVIRONMENT as string) || "local"
      };
    }
    
    // Direct global properties (fallback)
    if (gh.DB || gh.STORAGE) {
      return {
        DB: gh.DB as D1Database,
        STORAGE: gh.STORAGE as R2Bucket,
        SESSION_SECRET: (gh.SESSION_SECRET as string) || "",
        MFA_SECRET: (gh.MFA_SECRET as string) || "",
        ENCRYPTION_SECRET: (gh.ENCRYPTION_SECRET as string) || "",
        ENVIRONMENT: (gh.ENVIRONMENT as string) || "local"
      };
    }
  }
  
  // Local development fallback - use process.env
  // This works when running `astro dev` with .dev.vars loaded
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
