## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-01 - Floating Close Buttons Focus State
**Learning:** Floating or utility close buttons (e.g., 'x' icons) require explicit `focus-visible:ring` states alongside their standard hover effects for proper keyboard accessibility.
**Action:** Always add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal` to utility close buttons.
