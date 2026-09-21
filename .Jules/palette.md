## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-09-21 - Native summary keyboard focus
**Learning:** Native `<summary>` components inside Astro need explicit focus-visible rings for keyboard users because standard user agent stylesheets don't apply obvious focus indicators for custom-styled `<details>` summaries.
**Action:** Always add `focus-visible:outline-none focus-visible:ring-2` to styled `<summary>` elements to ensure WCAG 2.4.7 compliance.
