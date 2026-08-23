## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Added focus-visible states to floating close buttons
**Learning:** Floating or utility close buttons (like 'x' icons) in this project require explicit `focus-visible:ring` states alongside their standard hover effects to ensure proper keyboard navigation accessibility.
**Action:** Always add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal` to utility close buttons.
