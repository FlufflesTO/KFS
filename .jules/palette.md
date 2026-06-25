## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-06-25 - Prevent visual distraction with focus-visible
**Learning:** Using `focus:` for keyboard focus styles can distract mouse users when clicking interactive elements. `focus-visible:` provides a better UX by only showing the focus ring during keyboard navigation.
**Action:** Replaced `focus:ring` and `focus:ring-offset` with `focus-visible:ring` and `focus-visible:ring-offset` across UI components.
