## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-07-17 - Focus Visible for Buttons
**Learning:** Using `focus:ring` on buttons creates visual distraction for mouse users since the ring appears on click. Using `focus-visible:ring` ensures focus rings only appear for keyboard navigation, maintaining accessibility while improving mouse UX.
**Action:** Replaced `focus:ring` and `focus:ring-offset` with `focus-visible:ring` and `focus-visible:ring-offset` on primary UI button components, while retaining `focus:outline-none`.
