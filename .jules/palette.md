## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-29 - Focus States Accessibility
**Learning:** Using `focus:` on interactive elements like buttons causes visual distraction for mouse/touch users when they click, while still being needed for keyboard users.
**Action:** Always use the `focus-visible:` pseudo-class (e.g., `focus-visible:ring-2`) instead of `focus:` for focus rings on buttons and links, ensuring they only trigger during keyboard navigation.
