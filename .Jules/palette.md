## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2023-10-27 - Using focus-visible for custom focus rings
**Learning:** Using `focus:` for custom focus rings causes visual distraction for mouse users when they click elements, while `focus-visible:` only shows focus rings for keyboard navigation, providing a better experience for all users.
**Action:** Always use the `focus-visible:` pseudo-class (e.g., `focus-visible:ring-2`) instead of `focus:` for custom focus rings on interactive elements, while retaining `focus:outline-none` unconditionally to strip away the browser's default native focus rings.
