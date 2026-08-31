## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Keyboard accessibility for close buttons
**Learning:** Floating or utility close buttons (e.g. 'x' icons) need proper focus-visible styles for keyboard navigation.
**Action:** Adding explicit `focus-visible:ring` and `focus-visible:outline-none` classes to close buttons in portal layouts and toasts.
