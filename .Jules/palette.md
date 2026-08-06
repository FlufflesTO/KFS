## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Use focus-visible for button components
**Learning:** Using `focus-visible:` instead of `focus:` for focus rings in button components prevents visual distraction for mouse users while maintaining keyboard accessibility.
**Action:** Replaced `focus:ring` and `focus:ring-offset` classes with `focus-visible:ring` and `focus-visible:ring-offset` in `KharonButton.astro` and `Button.astro` components.
