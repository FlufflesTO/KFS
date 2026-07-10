## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Use focus-visible instead of focus for keyboard accessibility
**Learning:** Using `focus:` indiscriminately causes focus rings to appear even on mouse clicks, causing visual distraction for mouse users.
**Action:** Consistently use the `focus-visible:` pseudo-class (e.g. `focus-visible:ring-2`) instead of `focus:` for focus rings on interactive elements like buttons, ensuring they only trigger during keyboard navigation.
