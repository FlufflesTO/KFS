## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-04 - Keyboard Focus on Toast Notification Close Button
**Learning:** Floating 'x' icon buttons for ephemeral elements like toast notifications are easily missed for keyboard focus accessibility; they must explicitly implement focus-visible rings (e.g. `focus-visible:ring-2 focus-visible:ring-kharon-cyan`) alongside their standard hover effects.
**Action:** Always verify floating utility close buttons have explicit `focus-visible` utility classes for keyboard navigation.
