## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-06-18 - Focus vs Focus-Visible Learning
**Learning:** To prevent visual distraction for mouse users, applying keyboard focus styles via `focus-visible:` (e.g., `focus-visible:ring-2`) instead of `focus:` ensures that focus rings only trigger during keyboard navigation, improving both aesthetics and accessibility.
**Action:** Replaced `focus:` with `focus-visible:` across Button, KharonButton, and POPIA consent checkboxes in the UI components.
