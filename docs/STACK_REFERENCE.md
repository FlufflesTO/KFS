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

**Verified live against current docs (2026-06-03):**
- **Astro** — the project's `adapter: cloudflare()` SSR config matches current docs.
  Current adapter also exposes an experimental `@astrojs/cloudflare/hono` handler for
  custom worker entrypoints (`Astro.locals.cfContext`, session-KV injection,
  `waitUntil`, `cf-connecting-ip`).
- **Tailwind v4** — CSS-first `@theme { --color-*: … }` token model is current and is
  exactly what this project's design system uses. No `tailwind.config.js`. Colors
  override by redefining `--color-*` vars inside `@theme`.
- **Zod 4** — `safeParse()` returns `{ success, error: ZodError }`; read failures via
  **`error.issues[]`** (each `{ code, expected, path, message }`). A `zod/mini`
  variant exists with terser messages. ⚠️ If any handler still reads `error.errors`,
  switch to `error.issues` for v4.
- **D1 / Wrangler 4** — `wrangler d1 migrations apply <DB> --local|--remote|--preview`
  (`--persist-to` for local dir); it **captures a backup after applying**. Queries use
  `db.prepare("… WHERE x = ?").bind(value)` — parameterised, matching the repository layer.

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

## ⚠️ Dependency notes worth a look

`package.json` declares two generically-named packages that are unusual for this
stack and may be accidental installs — verify they are intended before the next
`npm install` / lockfile refresh:

- `claude` `^0.1.1`
- `cli` `^1.0.1`

If nothing imports them (`grep -r "from \"claude\"" src`), consider removing them.
