## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-07 - Missing Focus States on Close Buttons
**Learning:** Small, icon-only utility buttons (like '×' for closing modals or toasts) frequently get overlooked for keyboard focus states, making it impossible for keyboard users to know which element is focused or interact with them effectively.
**Action:** Ensure all interactive elements, especially utility buttons without visible text, explicitly define `focus-visible:ring` states alongside their standard hover effects.
