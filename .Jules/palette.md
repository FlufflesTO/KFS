## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-08-16 - Focus indicators for modal and notification close buttons
**Learning:** Floating and utility close buttons ('x' icons) in modals, toasts, and drawers require explicit focus-visible:ring states to ensure keyboard accessibility, as they often lack background color shifts.
**Action:** Add focus:outline-none focus-visible:ring-2 and appropriate ring offsets to all functional icon-only dismiss/close buttons.
