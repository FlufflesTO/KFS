# Cursor Agent Setup — KFS Project

Installed for the Kharon Fire & Security (Astro + Cloudflare) stack.

## Project skills (`.cursor/skills/`)

These are available to Cursor Agent in this repo without marketplace install.

### Stack-specific (KFS)
| Skill | Use when |
|---|---|
| `astro` | Editing `.astro` pages, SSR, middleware |
| `wrangler` | D1, R2, Workers, Cloudflare deploy |
| `tailwind-css-patterns` | Tailwind v4 styling per DESIGN_CONSTITUTION |
| `security-review` | CSP, CSRF, auth, POPIA-sensitive changes |
| `accessibility` | WCAG, touch targets, ARIA |
| `playwright-cli` | E2E browser automation |
| `context7-mcp` | Live docs for Astro, Tailwind, Wrangler, etc. |
| `run-kfs` | Build, dev server, portal login smoke tests |

### Engineering workflow (pstack)
| Skill | Use when |
|---|---|
| `/poteto-mode` | Default entry for non-trivial engineering tasks |
| `principle-*` (19 skills) | Individual engineering principles |
| `tdd`, `architect`, `typescript-best-practices`, `interrogate`, `unslop`, etc. | Targeted workflows |

### Team kit (cursor-team-kit)
| Skill | Use when |
|---|---|
| `deslop` | Clean AI-generated copy/code |
| `fix-ci`, `loop-on-ci` | CI failures |
| `run-smoke-tests`, `verify-this` | Validation before ship |
| `review-and-ship`, `make-pr-easy-to-review` | PR workflow |
| `check-compiler-errors` | Type/build errors |

## Marketplace plugins (enable in Cursor IDE)

Project skills mirror plugin content, but for full plugin integration (agents, updates), run in Cursor chat:

```
/add-plugin pstack
/add-plugin cursor-team-kit
```

Then reload the window. Verify under **Settings → Rules**.

## Claude Code plugins (`.claude/settings.json`)

Enabled at project root:
- `cloudflare-developer-kit@claude-plugins-official`
- `playwright@claude-plugins-official`

## Quick commands

```
/poteto-mode          — rigorous engineering workflow
/run-kfs              — local dev + portal smoke test (via run-kfs skill)
/principle-fix-root-causes
/principle-make-operations-idempotent
/deslop               — tighten AI output (team-kit)
```

## CLI agent with plugins

```powershell
agent --plugin-dir "$env:USERPROFILE\.cursor\plugins\cache\cursor-public\pstack\683cdbda983ea8be4b766ac3fe94b7b88e7f75ad" "your prompt"
```

## Not installed (not relevant to KFS)

- `buildkite` — no Buildkite CI in this repo
- `mixpanel-mcp` — no Mixpanel integration
- `twilio-developer-kit` — not used in KFS
