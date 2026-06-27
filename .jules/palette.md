## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-06-27 - Focus Rings with Focus Visible
**Learning:** Using `focus:` for focus rings causes visual distractions for mouse users. The `focus-visible:` pseudo-class provides a much better experience by only showing rings during keyboard navigation.
**Action:** Use `focus-visible:ring-2` instead of `focus:ring-2` for all interactive element focus states.
