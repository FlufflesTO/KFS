---
name: astro
description: Guidelines for building Astro 6.x pages, server-side rendering (SSR), middleware handlers, layout templates, and integrating Tailwind v4. Use when editing or creating .astro files, middleware, or server routes.
---

# Astro 6.x Server-Side Rendering (SSR) & Development Guidelines

This project runs Astro 6.x in Server (SSR) mode with `@astrojs/cloudflare` v13.

## Core Directives

1. **Explicit TypeScript Types**: All Astro components and server-side scripts must be strictly typed. Avoid `any`.
2. **CSP Nonce Support**: Every inline `<script>` tag in layout or page files MUST have the `nonce` attribute populated via `Astro.locals.nonce`:
   ```astro
   <script nonce={Astro.locals.nonce}>
     // Client-side script here
   </script>
   ```
3. **No innerHTML**: Do not use `innerHTML`, `outerHTML`, or `insertAdjacentHTML` inside client-side scripts. Use `textContent` or programmatic DOM building.
4. **Touch Target Accessibility**: Verify all links, buttons, and input elements have a minimum interactive area of `44x44px` as per `DESIGN_CONSTITUTION.md`.

## Middleware & Locals

- Locals available via `Astro.locals`:
  - `user`: Currently authenticated user or `null`
  - `nonce`: CSP Cryptographic Nonce for script injection
  - `cfContext`: Cloudflare ExecutionContext (`Astro.locals.cfContext.waitUntil(...)`)
- Middleware handlers live in `src/middleware.ts`. Do not bypass them.
