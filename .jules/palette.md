## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-05 - Add ARIA labels to inline table form inputs
**Learning:** Screen readers struggle to parse inputs lacking explicit labels within data tables, making them inaccessible.
**Action:** Always include `aria-label` attributes on inline form inputs where visible `<label>` elements are omitted for layout constraints.
