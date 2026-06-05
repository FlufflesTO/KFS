# Stack Reference — Official Documentation Index

Authoritative documentation links for every framework, language, runtime, and
tool used in this project. Versions are the **installed** versions resolved from
`node_modules` on 2026-06-03; the declared range from `package.json` is shown
where it differs. Prefer these official sources (or the `ctx7` CLI / `find-docs`
skill) over training data — APIs change.

> Tip: `npx ctx7@latest library "<name>" "<question>"` then
> `npx ctx7@latest docs <id> "<question>"` fetches current, version-specific docs
> for any item below. **On Windows, run `ctx7` from PowerShell, not Git Bash** —
> Git Bash (MSYS) rewrites a leading `/org/repo` ID into a `C:/Program Files/Git/...`
> path and the lookup fails.

### Verified Context7 library IDs (use these to skip the resolve step)

| Library | Context7 ID | Notes |
|---------|-------------|-------|
| Astro (official docs) | `/withastro/docs` | 6,818 snippets, High rep — best for guides |
| Astro (source repo) | `/withastro/astro` | indexed at `astro_6.3.1` |
| Tailwind CSS (v4) | `/tailwindlabs/tailwindcss.com` | official v4 docs (use `/websites/v3_tailwindcss` only for v3) |
| Zod | `/colinhacks/zod` | versions `v3.24.2`, `v4.0.1` — pin `…/zod/v4.0.1` for v4 |
| Cloudflare D1 | `/llmstxt/developers_cloudflare_d1_llms-full_txt` | 88 benchmark; or `/cloudflare/cloudflare-docs` for all CF products |
| _others_ | run `ctx7 library "<name>" "<question>"` | resolve on demand |

**Verified live against current docs (2026-06-04):**
- **Astro 6 + `@astrojs/cloudflare` v13** — major dev-experience change: `astro dev` now
  runs Cloudflare's Vite plugin + the real `workerd` runtime, closely mirroring production
  (no more Node shim). Astro 6 **requires** adapter v13+.
  - ⚠️ **Removed API:** `Astro.locals.runtime` is gone. `Astro.locals.runtime.ctx` →
    **`Astro.locals.cfContext`** (the `ExecutionContext`, for `waitUntil()`). Any remaining
    `locals.runtime` usage breaks under v13 — grepped clean in `src/` on 2026-06-04.
  - **Canonical binding access** is now a direct module import (works even at top-level
    scope and in v13 dev): `import { env } from 'cloudflare:workers';` → `env.DB`, `env.MY_KV`.
    See "Canonical patterns" below — `src/lib/server/bindings.ts` currently uses a
    middleware-set global-store workaround instead; revisit now that v13 workerd dev is live.
  - Adapter also exposes an experimental `@astrojs/cloudflare/hono` handler for custom
    worker entrypoints (session-KV injection via `sessionKVBindingName`, `cf-connecting-ip`).
- **Tailwind v4** — CSS-first `@theme { --color-*: … }` token model is current and is
  exactly what this project's design system uses. No `tailwind.config.js`. Colors
  override by redefining `--color-*` vars inside `@theme`. `@config`/`@plugin` directives
  can incrementally pull in legacy JS config alongside `@theme` if ever needed.
- **Zod 4** — `safeParse()` returns `{ success, error: ZodError }`; read failures via
  **`error.issues[]`** (each `{ code, expected, path, message }`). A `zod/mini`
  variant exists with terser messages. ⚠️ If any handler still reads `error.errors`,
  switch to `error.issues` for v4. Additional v4 breaking changes — see "Canonical
  patterns" below: `.merge()` deprecated → `.extend()`/spread; `required_error`/
  `invalid_type_error`/`errorMap` → single `error:` fn; `z.coerce.*` input type is now `unknown`.
- **D1 / Wrangler 4** — `wrangler d1 migrations apply <DB> --local|--remote|--preview`
  (`--persist-to` for local dir); it **captures a backup after applying**. Queries use
  `db.prepare("… WHERE x = ?").bind(value)` — parameterised, matching the repository layer.
  Use **`wrangler types`** to generate the `Env` interface from wrangler config instead of
  hand-writing it (catches binding mismatches at compile time).

---

## Language & type system

| Tool | Installed | Official docs |
|------|-----------|---------------|
| TypeScript | 6.0.3 | https://www.typescriptlang.org/docs/ · Release notes: https://www.typescriptlang.org/docs/handbook/release-notes/ |
| Node.js (runtime/engine) | `>=22.12.0` (engines) | https://nodejs.org/docs/latest-v22.x/api/ |
| ECMAScript / Web Crypto (used in `scripts/hash-password.ts`, auth) | — | https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API · SubtleCrypto PBKDF2: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits |

## Framework — Astro (SSR)

| Item | Installed | Official docs |
|------|-----------|---------------|
| Astro | 6.3.3 (6.4.x available — `npx @astrojs/upgrade`) | https://docs.astro.build/ |
| `@astrojs/cloudflare` (SSR adapter) | 13.6.0 | https://docs.astro.build/en/guides/integrations-guide/cloudflare/ |
| `@astrojs/sitemap` | 3.7.3 | https://docs.astro.build/en/guides/integrations-guide/sitemap/ |
| `@astrojs/check` (type checking) | 0.9.9 | https://docs.astro.build/en/guides/typescript/ |

Key Astro topics for this codebase:
- On-demand rendering / SSR: https://docs.astro.build/en/guides/on-demand-rendering/
- Middleware (`src/middleware.ts`): https://docs.astro.build/en/guides/middleware/
- Endpoints / API routes (`src/pages/**/api`): https://docs.astro.build/en/guides/endpoints/
- Server islands & `Astro.locals`: https://docs.astro.build/en/reference/api-reference/

## Runtime & platform — Cloudflare

| Item | Installed/Binding | Official docs |
|------|-------------------|---------------|
| Wrangler CLI | 4.95.0 (declared `^4.92.0`) | https://developers.cloudflare.com/workers/wrangler/ |
| `@cloudflare/workers-types` | 4.2026053x | https://developers.cloudflare.com/workers/languages/typescript/ |
| Workers (SSR target) | — | https://developers.cloudflare.com/workers/ |
| D1 (binding `DB`, `kharon-portal`) | — | https://developers.cloudflare.com/d1/ · Migrations: https://developers.cloudflare.com/d1/reference/migrations/ |
| R2 (binding `STORAGE`) | — | https://developers.cloudflare.com/r2/ |
| Workers KV (binding `SESSION`) | — | https://developers.cloudflare.com/kv/ |
| Cloudflare Images (binding `IMAGES`) | — | https://developers.cloudflare.com/images/ |
| Cron Triggers (hourly retention `0 * * * *`) | — | https://developers.cloudflare.com/workers/configuration/cron-triggers/ |
| Pages (public website deploy) | — | https://developers.cloudflare.com/pages/ |
| `cloudflare:workers` module (`src/lib/server/bindings.ts`) | — | https://developers.cloudflare.com/workers/runtime-apis/bindings/ |

## Styling

| Item | Installed | Official docs |
|------|-----------|---------------|
| Tailwind CSS | 4.3.0 | https://tailwindcss.com/docs |
| `@tailwindcss/vite` (v4 Vite plugin) | 4.3.0 | https://tailwindcss.com/docs/installation/using-vite · v4 upgrade: https://tailwindcss.com/docs/upgrade-guide |

> Tailwind v4 uses CSS-first config (`@layer`, `@theme`) — not `tailwind.config.js`.
> CSS budget is enforced by `scripts/purge-css.ts` (see `CLAUDE.md` size budgets).

## Build tooling

| Item | Installed | Official docs |
|------|-----------|---------------|
| Vite (via Astro) | (bundled with Astro 6) | https://vite.dev/ |
| esbuild (service-worker build, `scripts/build-sw.js`) | 0.27.7 | https://esbuild.github.io/ |
| jiti (config loader) | 2.7.0 | https://github.com/unjs/jiti |

## Validation & data

| Item | Installed | Official docs |
|------|-----------|---------------|
| Zod (schemas in `packages/types/src/base.ts`) | 4.4.3 | https://zod.dev/ |

## Testing & quality

| Item | Installed | Official docs |
|------|-----------|---------------|
| Playwright (`@playwright/test`) | 1.60.0 | https://playwright.dev/docs/intro |
| `@axe-core/playwright` (a11y) | 4.11.3 | https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md · Axe rules: https://dequeuniversity.com/rules/axe/ |
| ESLint | 10.4.0 | https://eslint.org/docs/latest/ |
| `typescript-eslint` | 8.60.0 | https://typescript-eslint.io/ |
| Husky (git hooks) | 9.1.7 | https://typicode.github.io/husky/ |

## Documents & assets

| Item | Installed | Official docs |
|------|-----------|---------------|
| pdf-lib (certificate/report PDFs) | 1.17.1 | https://pdf-lib.js.org/ |
| qrcode (MFA/TOTP QR) | 1.5.4 | https://github.com/soldair/node-qrcode#readme |

## External integrations

| Item | Where | Official docs |
|------|-------|---------------|
| Sage Accounting API (OAuth2, `sage-client.ts`) | `src/lib/server/services/` | https://developer.sage.com/accounting/ · OAuth: https://developer.sage.com/accounting/guides/authenticating/authentication/ |
| OpenRouter SDK / Agent (`@openrouter/sdk`, `@openrouter/agent`) | deps | https://openrouter.ai/docs |

## Implementation methods / patterns (project-specific, see `CLAUDE.md`)

- **PWA / Service Worker** — `src/sw.ts` compiled by esbuild; network-first APIs,
  cache-first assets. MDN: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Background Sync / IndexedDB drafts** — `src/lib/offline/`. MDN:
  https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API ·
  https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- **Content Security Policy (nonce-based)** — middleware. MDN:
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
- **PBKDF2 password hashing + constant-time token compare** — Web Crypto (link above).
- **POPIA compliance (SHA-256 IP hashing, audit logging)** — regulatory:
  https://popia.co.za/

---

## Canonical patterns (current as of 2026-06-04)

Copy-pasteable, version-correct snippets pulled from official docs. Prefer these over
older patterns when touching the relevant code.

### Cloudflare bindings in Astro 6 / adapter v13

```ts
// Documented, supported path — works at top-level scope AND in v13 workerd dev.
import { env } from 'cloudflare:workers';

const db = env.DB;            // D1Database
const storage = env.STORAGE; // R2Bucket
const secret = env.SESSION_SECRET;
```

```astro
---
// ExecutionContext (waitUntil, etc.) — NOTE the v13 rename from locals.runtime.ctx:
const cf = Astro.locals.cfContext;
cf.waitUntil(someAsyncWork());
---
```

> ⚠️ Cloudflare Workers best practice: **avoid module-level mutable state** — isolates are
> reused across requests, so caching request-scoped data in a top-level `let` can leak
> across requests. Bindings/secrets are isolate-stable so caching *those* is lower-risk,
> but the direct `import { env }` form avoids the question entirely.
> `src/lib/server/bindings.ts` predates v13 workerd dev (built to work around a dev-time
> 500) and uses a `setCloudflareEnv()` global store + 5-deep fallback chain; it is a
> candidate for simplification down to `import { env }` + a `process.env` fallback.

### Zod 4 at API boundaries (`packages/types/src/base.ts`)

```ts
// merge() is deprecated in v4:
const Extended = Base.extend({ ...Additional.shape });   // recommended
// or, best tsc performance:
const Extended = z.object({ ...Base.shape, ...Additional.shape });

// errorMap / required_error / invalid_type_error → single error fn:
z.string({
  error: (issue) => issue.input === undefined ? 'Required' : 'Must be a string',
});

// z.coerce.* input type is now `unknown` (was string in v3) — relevant to cleanInt/cleanBoolean.
// Read failures via error.issues[], not error.errors.
const r = Schema.safeParse(input);
if (!r.success) for (const i of r.issues) { /* i.code, i.path, i.message */ }
```

### Workers best practices worth adopting (CF changelog, 2026-06)

- `wrangler types` to generate the `Env` interface — never hand-write it.
- Web Crypto (not `Math.random()`) for security tokens — already done in recent commits.
- Stream large request/response bodies (`TransformStream`/`pipeTo`) — 128 MB isolate limit.
- Queues/Workflows for background work (e.g. growth of the hourly retention cron / Sage sync).
- Always `await` or `ctx.waitUntil()` promises — no floating promises.

---

## Relevant skills, MCP servers & doc-fetch tools

Curated for *this* stack (ignore the Rspack/AWS/Twilio/Adobe plugin packs — not applicable).

| Tool | Type | Use for |
|------|------|---------|
| `run-kfs` | skill (project) | Build / launch / screenshot / authenticated login smoke-test of site + portal |
| `astro` | skill | `.astro` components, SSR config, content collections, adapter work |
| `wrangler` | skill | D1 migrations, deploys, secrets, `wrangler types` (biases to live CF docs) |
| `durable-objects` | skill | If rate-limiting / session coordination moves off the global-store pattern |
| `tailwind-css-patterns` | skill | Styling within `DESIGN_CONSTITUTION.md` |
| `playwright-cli` | skill | E2E suite in `tests/` (with `@axe-core/playwright`) |
| `accessibility` | skill | WCAG audits (pairs with axe-core + 44×44px / focus-ring rules) |
| `find-docs` / `context7-mcp` | skill | Current library docs — use before any version-sensitive change |
| `security-review`, `/code-review` | skill/cmd | Pre-PR, given CSP/CSRF/constant-time/IP-hash invariants |
| `supabase-postgres-best-practices` | skill | Transferable SQL/index patterns for the D1 repository layer |
| **Cloudflare Developer Platform** | MCP | `d1_database_query`, `r2_buckets_list`, `workers_list`, `search_cloudflare_documentation` |
| **Context7** | MCP | `resolve-library-id` → `query-docs` for any lib above |
| **Microsoft Learn** | MCP | Only if Sage/OAuth/Azure-side integration work appears |

Verified Context7 IDs used 2026-06-04 (current/highest-benchmark): Astro
`/websites/astro_build_en`, Tailwind v4 `/websites/tailwindcss`, Zod 4
`/websites/zod_dev_v4`.

---

## Creative & visual tooling map (skills · plugins · MCPs)

Curated 2026-06-04 for the design/branding/marketing/diagram side of this project. Split
into **capability tooling that exists** vs. **KFS subject domains that have no dedicated
tooling** (they're physical fire-&-security service lines, not software categories).

### Frontend / UI / UX
| Tool | Type | For |
|------|------|-----|
| `frontend-design` | skill | UI implementation guidance, layout/visual polish |
| `astro` | skill | `.astro` components/pages, SSR (the framework) |
| `tailwind-css-patterns` | skill | Utility-first styling, responsive layout (v4) |
| `accessibility` | skill | WCAG 2.1, keyboard/SR, focus rings (pairs with axe-core + 44×44px constitution) |
| `storybook-rsbuild` | skill | Component dev harness (only if Storybook is adopted) |
| `playwright-cli` | skill | Drive/test UI flows |
| Webflow · Vercel · Dovetail | MCP | Visual web-design · deploy previews/logs · UX research repo |

### Graphics / visualisation / animation
| Tool | Type | For |
|------|------|-----|
| `hyperframes:three` / `:lottie` / `:gsap` / `:animejs` / `:css-animations` / `:waapi` / `:typegpu` / `:tailwind` | skill | 3D, Lottie, timeline/JS/CSS/WAAPI motion, GPU compute, animation utilities |
| `hyperframes` + `:hyperframes-media` / `:hyperframes-cli` | skill | Animation toolkit core + media/CLI |
| Three.js 3D Viewer | MCP | `show_threejs_scene`, `learn_threejs` |
| tldraw | MCP | Programmatic canvas / freeform diagrams via JS |

### Branding / marketing / graphic assets
| Tool | Type | For |
|------|------|-----|
| **Canva** | MCP | **Primary.** Logos, posters, flyers, infographics, social, decks; **brand kits**; export PNG/PDF/PPTX; resize |
| `adobe-for-creativity:*` (design-from-template, create-social-variations, batch-edit-photos, retouch-portraits, resize-photos-and-videos, edit-quick-cut) | skill | Branded templates, social variants, photo/video editing |
| Adobe for creativity | MCP | Backs the Adobe skills |
| Invideo | MCP | `generate-video-from-script` — marketing video (YT/IG/TikTok) |
| Peec AI | MCP | AI-search / brand-visibility monitoring (marketing analytics) |
| `firecrawl-search` / `firecrawl` · `deep-research` | skill | Competitor/market research; multi-source fact-checked briefs |

### Technical diagrams & drawings
| Tool | Type | For |
|------|------|-----|
| **Lucid** (Lucidchart) | MCP | **Best for system/technical diagrams** — flowcharts, **SVG→diagram**, org charts, mind maps, UML sequence, BPMN/swimlanes, AWS/GCP/Azure shapes. Use for riser diagrams, zone plans, cause-&-effect matrices, architecture. |
| Mermaid Chart | MCP | Code-as-diagram (flow/sequence/ER/gantt) — embeddable in markdown docs |
| tldraw | MCP | Hand-style/freeform schematics |
| `sequential-thinking` | skill | Structuring diagram logic before drawing |

### Icon generation & implementation
No dedicated icon-set generator skill/MCP exists. Paths:
- **Generate** logo/icon-style graphics → **Canva** (`logo` type) or **Adobe** skills.
- **Implement** UI icons (constitution = "SVG icons only, no emojis") → hand-author SVG, or
  pull an icon library (Lucide / Heroicons / Phosphor) via **`find-docs`/Context7**, then
  wire in with `astro` + `tailwind-css-patterns`.
- Animated/3D icons → `hyperframes:lottie` / `:three`.

### KFS subject domains — **no dedicated tooling**
SANS · fire detection · gas suppression · access control · CCTV · intrusion detection ·
public address · public/voice evacuation · ironmongery · fire doors · fire signage ·
emergency lighting.

These are physical engineering/compliance domains (the company's service lines), so there
are **no skills/plugins/MCPs specific to them** — verified against the live MCP registry.
What serves them:
- **SANS (South African National Standards)** — e.g. SANS 10139 (fire detection), 1186
  (signage), 10114 (emergency lighting), voice-evac codes. No tool ships these; research via
  **`firecrawl-search`/`firecrawl-scrape`**, **`deep-research`**, or **WebSearch/WebFetch**.
  ⚠️ `find-docs`/Context7 is for *software* libraries — it will NOT have building standards.
  Project already tracks coverage in `docs/sans-coverage-matrix.md`.
- **Diagrams** for these systems → Lucid / Mermaid. **Marketing/spec content & icons** →
  Canva / Adobe. Domain content already lives in `src/content`, `src/data`, and the service
  pages (`src/pages/fire-detection.astro`, `gas-suppression.astro`, etc.).

> Reach-for cheat sheet: build/style UI → `astro`+`tailwind-css-patterns`+`frontend-design`+
> `accessibility`; system/riser diagrams → **Lucid** (Mermaid in-doc); logos/brochures/social/
> brand kit → **Canva** (+Adobe); marketing video → **Invideo**; motion/3D → `hyperframes:*` /
> Three.js Viewer; research SANS/market → `firecrawl-*` / `deep-research` / WebSearch.

---

## ⚠️ Dependency notes worth a look

`package.json` (as of 2026-06-04) declares two AI-SDK packages that are unusual for a
fire-&-security portal and have no obvious call site in the SSR/portal flow — verify
they are intended (and not accidental / leftover from experimentation) before the next
`npm install` / lockfile refresh:

- `@openrouter/agent` `^0.7.0`
- `@openrouter/sdk` `^0.12.79`

If nothing imports them (`grep -rE "from \"@openrouter/" src`), consider removing them
to trim the dependency surface. (The previously-flagged stray `claude`/`cli` packages
are no longer present — resolved.)
