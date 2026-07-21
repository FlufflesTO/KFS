## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-07-21 - Focus-visible over Focus
**Learning:** Using `focus:ring` on buttons creates visual distraction for mouse users, as the ring appears on click.
**Action:** Always use `focus-visible:` pseudo-classes (e.g., `focus-visible:ring-2`) instead of `focus:` for custom focus rings on interactive elements to ensure they only appear for keyboard navigation, while retaining `focus:outline-none` unconditionally.
