/**
 * Project Sentinel - Cron Trigger Handler
 * Purpose: Handles scheduled cron jobs for automated maintenance tasks
 * Dependencies: ./lib/server/rateLimit
 * Structural Role: Scheduled task executor for backend maintenance
 * 
 * Scheduled Tasks:
 * - Hourly: Rate limit pruning (remove entries older than 24 hours)
 */

import { pruneRateLimits } from "./lib/server/rateLimit";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  SESSION_SECRET: string;
  [key: string]: unknown;
}

/**
 * Cron handler - invoked by Cloudflare Workers cron triggers
 * @param scheduledTime - The scheduled time as a Date object
 * @param cron - The cron expression that triggered this invocation
 * @param env - Worker environment bindings
 */
export async function scheduled(
  scheduledTime: ScheduledController,
  cron: string,
  env: Env
): Promise<void> {
  const now = new Date();
  const timestamp = now.toISOString();

  console.log(`[Cron] Triggered at ${timestamp} with cron: ${cron}`);

  try {
    // Rate limit pruning - runs every hour
    // Remove entries older than 24 hours to keep table size manageable
    const deletedCount = await pruneRateLimits(env.DB, 24);
    console.log(`[Cron] Rate limit pruning complete: ${deletedCount} entries deleted`);
  } catch (error) {
    const err = error as Error;
    console.error(`[Cron] Error during scheduled task: ${err.message}`, {
      name: err.name,
      stack: err.stack
    });
    // Re-throw to ensure the error is logged by the Workers runtime
    throw error;
  }
}
