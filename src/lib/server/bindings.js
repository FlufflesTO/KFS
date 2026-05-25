/**
 * Project Sentinel - Cloudflare Workers Bindings
 * Purpose: Provides access to database and storage bindings and standard fee config
 * Dependencies: cloudflare:workers
 * Structural Role: Server-side bindings and configuration accessor
 */

import { env } from "cloudflare:workers";

export function getBindings() {
  const db = env.DB;
  const storage = env.STORAGE;

  if (!db) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }

  if (!storage) {
    throw new Error("Cloudflare R2 binding STORAGE is not configured.");
  }

  return { db, storage, env };
}

export function getDatabase() {
  const db = env.DB;

  if (!db) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }

  return db;
}

export function getStorage() {
  const storage = env.STORAGE;

  if (!storage) {
    throw new Error("Cloudflare R2 binding STORAGE is not configured.");
  }

  return storage;
}

export function getStandardServiceFee() {
  const raw = env.STANDARD_SERVICE_FEE || "1850.00";
  const configured = Number(raw);
  if (Number.isFinite(configured) && configured >= 0) {
    if (raw.includes(".") || configured < 100000) {
      return Math.round(configured * 100);
    }
    return Math.round(configured);
  }
  return 185000;
}
