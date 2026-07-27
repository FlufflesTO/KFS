## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-07-28 - focus-visible is preferred over focus for interactivity
**Learning:** Using `focus:ring` causes visual rings to appear when mouse users click buttons, which is often distracting and less aesthetically pleasing. Using `focus-visible:ring` provides the same accessibility for keyboard navigation while remaining invisible to mouse users.
**Action:** Always use `focus-visible:ring` instead of `focus:ring` for custom focus indicators on interactive elements, while retaining `focus:outline-none` unconditionally.
