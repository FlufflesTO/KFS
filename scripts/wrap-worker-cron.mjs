/**
 * Project Sentinel - Worker cron-handler wrapper (post-build)
 *
 * The @astrojs/cloudflare adapter generates `dist/server/entry.mjs` whose default
 * export is `{ fetch }` only. Cloudflare cron triggers (declared in
 * wrangler.portal.jsonc -> triggers.crons) require a `scheduled()` handler on the
 * worker's default export, otherwise the hourly invocation is a no-op.
 *
 * This script runs after `astro build` (see the `build` npm script). It:
 *   1. Bundles `src/cron.ts` to a standalone ESM module (`dist/server/_cron.mjs`).
 *   2. Renames the adapter entry to `entry.astro.mjs`.
 *   3. Replaces `entry.mjs` with a thin wrapper that merges the Astro `fetch`
 *      handler with the bundled `scheduled` handler.
 *
 * The rewrite is idempotent (guarded by a marker) and works for both the portal
 * worker deploy (uses dist/server/entry.mjs) and the flattened Pages output
 * produced by build-site.ps1 (entry.mjs -> _worker.js, siblings copied alongside).
 */
import { build } from "esbuild";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";

const MARKER = "/* cron-wrapped */";
const root = process.cwd();
const serverDir = join(root, "dist", "server");
const entryPath = join(serverDir, "entry.mjs");
const astroEntryPath = join(serverDir, "entry.astro.mjs");
const cronOutPath = join(serverDir, "_cron.mjs");

if (!existsSync(entryPath)) {
  console.error(`[wrap-worker-cron] ${entryPath} not found - did 'astro build' run first?`);
  process.exit(1);
}

const current = readFileSync(entryPath, "utf8");
if (current.includes(MARKER)) {
  console.log("[wrap-worker-cron] entry.mjs already wrapped; nothing to do.");
  process.exit(0);
}

// 1. Bundle the cron handler. cloudflare:workers / node: built-ins stay external
//    and are resolved by the workerd runtime at execution time.
await build({
  entryPoints: [join(root, "src", "cron.ts")],
  outfile: cronOutPath,
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  external: ["cloudflare:workers", "node:*"],
  logLevel: "info",
});

// 2. Preserve the original adapter entry (keeps its process polyfill + chunk import).
renameSync(entryPath, astroEntryPath);

// 3. Write the merged wrapper as the new entry.
const wrapper = `${MARKER}
import astroDefault from "./entry.astro.mjs";
import { scheduled } from "./_cron.mjs";

export default { ...astroDefault, scheduled };
`;
writeFileSync(entryPath, wrapper, "utf8");

console.log("[wrap-worker-cron] entry.mjs wrapped: default export now includes { fetch, scheduled }.");
