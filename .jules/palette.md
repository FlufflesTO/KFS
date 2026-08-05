## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Icon-only button focus states
**Learning:** Icon-only action buttons (like edit/delete icons in lists) often lack default focus indicators when styled with flexbox/svgs, severely hampering keyboard accessibility.
**Action:** Always add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2` (and appropriate offset colors) to icon-only interactive elements.
