## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Adding type="button" to semantic HTML buttons
**Learning:** React/Astro buttons default to type="submit", which can cause unintended page reloads when placed in or near form contexts.
**Action:** Always add type="button" to interactive, non-submit buttons to prevent forms from accidentally submitting.
