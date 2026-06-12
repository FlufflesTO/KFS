## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Adding aria-labels to interactive filters
**Learning:** Found interactive elements (search input, status/type filters) on the Tech Job History page missing `aria-label` attributes. Missing labels make it difficult for screen reader users to understand the purpose of form controls, especially those not wrapped by explicit `<label>` elements.
**Action:** Always verify that every interactive `input`, `select`, or `button` without visible text has an accessible name, typically provided by an `aria-label` attribute or an associated `<label>` element.
