## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-07-19 - Resolve CI audit failures
**Vulnerability:** CI failed on # npm audit report

astro  <=7.0.0-beta.6
Severity: high
Astro: Host header SSRF in prerendered error page fetch - https://github.com/advisories/GHSA-2pvr-wf23-7pc7
Astro: XSS via Unescaped Attribute Names in Spread Props - https://github.com/advisories/GHSA-jrpj-wcv7-9fh9
Depends on vulnerable versions of esbuild
fix available via `npm audit fix`
node_modules/astro

esbuild  0.27.3 - 0.28.0
esbuild allows arbitrary file read when running the development server on Windows - https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
fix available via `npm audit fix --force`
Will install esbuild@0.28.1, which is a breaking change
node_modules/esbuild
node_modules/wrangler/node_modules/esbuild
  wrangler  <=0.0.0-31bfd374c || 4.64.0 - 4.101.0
  Depends on vulnerable versions of esbuild
  Depends on vulnerable versions of miniflare
  node_modules/wrangler
    @cloudflare/vite-plugin  <=0.0.0-7b9716462 || 0.1.5 - 1.41.0
    Depends on vulnerable versions of miniflare
    Depends on vulnerable versions of wrangler
    Depends on vulnerable versions of ws
    node_modules/@cloudflare/vite-plugin

js-yaml  4.0.0 - 4.1.1
Severity: moderate
JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases - https://github.com/advisories/GHSA-h67p-54hq-rp68
fix available via `npm audit fix`
node_modules/js-yaml

undici  7.0.0 - 7.27.2
Severity: high
undici vulnerable to TLS certificate validation bypass via dropped requestTls in SOCKS5 ProxyAgent - https://github.com/advisories/GHSA-vmh5-mc38-953g
undici vulnerable to HTTP header injection via Set-Cookie percent-decoding - https://github.com/advisories/GHSA-p88m-4jfj-68fv
undici WebSocket client vulnerable to denial of service via fragment count bypass - https://github.com/advisories/GHSA-vxpw-j846-p89q
undici vulnerable to cross-origin request routing via SOCKS5 proxy pool reuse - https://github.com/advisories/GHSA-hm92-r4w5-c3mj
undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse - https://github.com/advisories/GHSA-35p6-xmwp-9g52
undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching - https://github.com/advisories/GHSA-g8m3-5g58-fq7m
undici vulnerable to cross-user information disclosure via shared cache whitespace bypass - https://github.com/advisories/GHSA-pr7r-676h-xcf6
fix available via `npm audit fix`
node_modules/undici
  miniflare  <=0.0.0-fff677e35 || 3.20250204.0 - 4.20260616.0
  Depends on vulnerable versions of undici
  Depends on vulnerable versions of ws
  node_modules/miniflare

vite  7.0.0 - 7.3.3
Severity: high
launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows - https://github.com/advisories/GHSA-v6wh-96g9-6wx3
vite: `server.fs.deny` bypass on Windows alternate paths - https://github.com/advisories/GHSA-fx2h-pf6j-xcff
fix available via `npm audit fix`
node_modules/vite

ws  8.0.0 - 8.20.1
Severity: high
ws: Memory exhaustion DoS from tiny fragments and data chunks - https://github.com/advisories/GHSA-96hv-2xvq-fx4p
fix available via `npm audit fix`
node_modules/ws

9 vulnerabilities (1 low, 1 moderate, 7 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force due to vulnerabilities in underlying dependencies (like esbuild).
**Learning:** Running
up to date, audited 531 packages in 10s

195 packages are looking for funding
  run `npm fund` for details

# npm audit report

esbuild  0.27.3 - 0.28.0
esbuild allows arbitrary file read when running the development server on Windows - https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
fix available via `npm audit fix --force`
Will install astro@7.1.1, which is a breaking change
node_modules/astro/node_modules/esbuild
node_modules/wrangler/node_modules/esbuild
  astro  5.17.3 - 7.0.0-beta.6
  Depends on vulnerable versions of esbuild
  node_modules/astro
    @astrojs/cloudflare  13.1.2 - 13.7.0
    Depends on vulnerable versions of astro
    node_modules/@astrojs/cloudflare
  wrangler  <=0.0.0-31bfd374c || 4.64.0 - 4.101.0
  Depends on vulnerable versions of esbuild
  Depends on vulnerable versions of miniflare
  node_modules/wrangler

undici  7.0.0 - 7.27.2
Severity: high
undici vulnerable to TLS certificate validation bypass via dropped requestTls in SOCKS5 ProxyAgent - https://github.com/advisories/GHSA-vmh5-mc38-953g
undici vulnerable to HTTP header injection via Set-Cookie percent-decoding - https://github.com/advisories/GHSA-p88m-4jfj-68fv
undici WebSocket client vulnerable to denial of service via fragment count bypass - https://github.com/advisories/GHSA-vxpw-j846-p89q
undici vulnerable to cross-origin request routing via SOCKS5 proxy pool reuse - https://github.com/advisories/GHSA-hm92-r4w5-c3mj
undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse - https://github.com/advisories/GHSA-35p6-xmwp-9g52
undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching - https://github.com/advisories/GHSA-g8m3-5g58-fq7m
undici vulnerable to cross-user information disclosure via shared cache whitespace bypass - https://github.com/advisories/GHSA-pr7r-676h-xcf6
fix available via `npm audit fix`
node_modules/undici
  miniflare  4.20260317.0 - 4.20260616.0
  Depends on vulnerable versions of undici
  node_modules/miniflare

6 vulnerabilities (3 low, 3 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force caused major breaking version updates that modified , violating project constraints.
**Prevention:** If
added 22 packages, removed 81 packages, changed 36 packages, and audited 472 packages in 29s

132 packages are looking for funding
  run `npm fund` for details

# npm audit report

esbuild  0.27.3 - 0.28.0
esbuild allows arbitrary file read when running the development server on Windows - https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
fix available via `npm audit fix`
node_modules/wrangler/node_modules/esbuild
  wrangler  <=0.0.0-31bfd374c || 4.64.0 - 4.101.0
  Depends on vulnerable versions of esbuild
  Depends on vulnerable versions of miniflare
  node_modules/wrangler

undici  7.0.0 - 7.27.2
Severity: high
undici vulnerable to TLS certificate validation bypass via dropped requestTls in SOCKS5 ProxyAgent - https://github.com/advisories/GHSA-vmh5-mc38-953g
undici vulnerable to HTTP header injection via Set-Cookie percent-decoding - https://github.com/advisories/GHSA-p88m-4jfj-68fv
undici WebSocket client vulnerable to denial of service via fragment count bypass - https://github.com/advisories/GHSA-vxpw-j846-p89q
undici vulnerable to cross-origin request routing via SOCKS5 proxy pool reuse - https://github.com/advisories/GHSA-hm92-r4w5-c3mj
undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse - https://github.com/advisories/GHSA-35p6-xmwp-9g52
undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching - https://github.com/advisories/GHSA-g8m3-5g58-fq7m
undici vulnerable to cross-user information disclosure via shared cache whitespace bypass - https://github.com/advisories/GHSA-pr7r-676h-xcf6
fix available via `npm audit fix`
node_modules/undici
  miniflare  4.20260317.0 - 4.20260616.0
  Depends on vulnerable versions of undici
  node_modules/miniflare

4 vulnerabilities (1 low, 3 high)

To address all issues, run:
  npm audit fix breaks package.json constraints, restore package files and submit the code with the CI failure to respect the strict constraint against modifying  without explicit instruction.

## 2026-07-19 - Resolve CI audit failures
**Vulnerability:** CI failed on npm audit --omit=dev due to vulnerabilities in underlying dependencies (like esbuild).
**Learning:** Running npm audit fix --force caused major breaking version updates that modified package.json, violating project constraints.
**Prevention:** If npm audit fix --force breaks package.json constraints, restore package files and submit the code with the CI failure to respect the strict constraint against modifying package.json without explicit instruction.
