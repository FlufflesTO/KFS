## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-06-30 - Replaced focus with focus-visible for better accessibility
**Learning:** The focus pseudo-class triggered focus rings on mouse click which was distracting for users, especially on inputs and buttons. It is better to use focus-visible instead, ensuring it's only shown when interacting via a keyboard.
**Action:** Replaced all `focus:ring` and `focus:outline` utility classes in Astro components with `focus-visible:ring` and `focus-visible:outline`.
