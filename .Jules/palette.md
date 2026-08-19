## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-08-19 - Toast close button missing focus ring
**Learning:** Floating or utility close buttons ('x' icons) explicitly require `focus-visible:ring` states alongside standard hover effects to ensure proper keyboard navigation accessibility in this codebase.
**Action:** Always add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan` to close buttons.
