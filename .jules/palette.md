## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-26 - Improving Focus Rings for Mouse Users
**Learning:** Using `focus:` for focus rings causes visual distraction for mouse users when they click interactive elements. Using `focus-visible:` ensures the ring only appears during keyboard navigation, improving UX without compromising accessibility.
**Action:** Use `focus-visible:` (e.g., `focus-visible:ring-2`) instead of `focus:` for focus rings on all interactive elements like buttons and links.
