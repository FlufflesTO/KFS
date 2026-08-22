## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Accessible Toast Close Button
**Learning:** Floating UI elements like toast notifications must ensure focusability of interactive components like close buttons for full accessibility keyboard navigation.
**Action:** Add `focus-visible:ring` classes (including `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-kharon-purple rounded`) to all interactive elements embedded in floating or toast UIs.
