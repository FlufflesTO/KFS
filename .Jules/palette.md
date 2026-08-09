## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Keyboard accessibility for small utility controls
**Learning:** Common utility buttons like "x" (close) icons frequently miss visible focus states, which breaks keyboard navigation accessibility for critical dismiss actions.
**Action:** Always ensure floating or utility close buttons explicitly define `focus-visible:ring` states alongside their standard hover effects.
