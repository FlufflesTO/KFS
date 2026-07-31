## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-07-31 - focus-visible over focus
**Learning:** For interactive UI elements, `focus:` modifier utility classes can add jarring visual outlines for mouse/touch users.
**Action:** Always prefer `focus-visible:` modifier (e.g., `focus-visible:ring-2`) while keeping `focus:outline-none` so that focus rings are strictly restricted to keyboard users, which increases both accessibility and usability without sacrificing aesthetics.
