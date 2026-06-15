## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-06-15 - Focus States Keyboard Accessibility vs Mouse Distraction
**Learning:** Using `focus:` for focus rings can visually distract mouse users when clicking interactive elements.
**Action:** Use the `focus-visible:` pseudo-class (e.g. `focus-visible:ring-2`) to ensure focus rings only appear during keyboard navigation, improving accessibility without degrading mouse user experience.
