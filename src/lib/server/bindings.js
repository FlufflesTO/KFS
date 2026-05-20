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
  const configured = Number(env.STANDARD_SERVICE_FEE || "1850.00");
  return Number.isFinite(configured) && configured >= 0 ? configured.toFixed(2) : "1850.00";
}
