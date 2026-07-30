## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-07-30 - Focus-visible for interactive elements
**Learning:** For interactive elements, using `focus-visible:` instead of `focus:` ensures that focus rings only appear when navigating via keyboard. Using `focus:` alone causes distracting focus rings to appear when mouse users click the elements. Keep `focus:outline-none` unconditionally to strip away the browser's default native focus rings across all interactions.
**Action:** Replace `focus:ring` and `focus:ring-offset` classes with `focus-visible:ring` and `focus-visible:ring-offset` in interactive components while preserving `focus:outline-none`.
