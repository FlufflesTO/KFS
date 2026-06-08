## 2025-06-02 - Enforced Auth Middleware on Inventory API
**Vulnerability:** Unauthenticated access to the inventory parts API endpoint (`src/pages/api/inventory/parts.ts`), allowing arbitrary parts allocation and manipulation.
**Learning:** In this Astro project, `authMiddleware` in `src/middleware.ts` exclusively protects routes starting with `/portal`. Endpoints handling sensitive data or operations placed in the root `/api/` directory bypass this security check entirely.
**Prevention:** Always place internal administrative or data-mutating APIs under the `/portal/api/` path to ensure they are automatically covered by the global session authentication and authorization middleware.
