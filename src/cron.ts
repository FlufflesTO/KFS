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
 * Cron handler - invoked by Cloudflare Workers cron triggers.
 * Signature matches the Workers runtime: (controller, env, ctx).
 * @param controller - ScheduledController (exposes the triggering cron expression)
 * @param env - Worker environment bindings
 * @param ctx - Execution context (used to keep the worker alive via waitUntil)
 */
export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const run = (async () => {
    const timestamp = new Date().toISOString();
    console.log(`[Cron] Triggered at ${timestamp} with cron: ${controller.cron}`);

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
      // Re-throw to ensure the error is surfaced in Workers logs / cron dashboard
      throw error;
    }
  })();

  // Keep the worker alive until the work completes; await so errors propagate.
  ctx.waitUntil(run);
  await run;
}
