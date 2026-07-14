## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-07-14 - Replaced focus: classes with focus-visible:
**Learning:** Relying on standard `focus:` styles (like `focus:ring`) across  components created unnecessary visual noise (focus rings) for mouse users clicking buttons, checkboxes, and form fields.
**Action:** Replaced `focus:` pseudo-classes with `focus-visible:` globally across interactive UI elements in Astro components. This ensures focus rings only appear during keyboard navigation, satisfying accessibility requirements while dramatically improving standard click UX.
## 2025-02-23 - Replaced focus: classes with focus-visible:
**Learning:** Relying on standard `focus:` styles (like `focus:ring`) across `.astro` components created unnecessary visual noise (focus rings) for mouse users clicking buttons, checkboxes, and form fields.
**Action:** Replaced `focus:` pseudo-classes with `focus-visible:` globally across interactive UI elements in Astro components. This ensures focus rings only appear during keyboard navigation, satisfying accessibility requirements while dramatically improving standard click UX.
