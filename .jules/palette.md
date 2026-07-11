## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-07-11 - Enforce focus-visible for better mouse UX
**Learning:** Using `focus:` for focus rings causes visual distraction for mouse users when they click interactive elements. It is an accessibility improvement to rely on `focus-visible:` for focus rings instead.
**Action:** Replaced `focus:ring-*` classes with `focus-visible:ring-*` on UI button components. Always use `focus-visible:` instead of `focus:` for focus rings.
