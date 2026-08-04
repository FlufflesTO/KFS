## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-08-04 - Focus-visible for better mouse UX
**Learning:** Using `focus:ring` on buttons causes the focus ring to appear on click, which can be visually distracting for mouse users while providing no real benefit.
**Action:** Use `focus-visible:` pseudo-class for custom focus rings on interactive elements, while retaining `focus:outline-none` unconditionally to strip the native focus ring.
