## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.


## 2026-07-29 - Prevent Focus Rings for Mouse Users
**Learning:** Using `focus:ring` on buttons creates a lingering focus ring when clicked with a mouse, which visually distracts users. Keyboard users rely on focus rings to know what element is active.
**Action:** Use `focus-visible:ring` instead of `focus:ring` on all interactive elements. This preserves accessibility for keyboard users while eliminating the distracting ring for mouse interactions.
