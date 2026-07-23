## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-07-23 - Focus States Should Use focus-visible
**Learning:** Native `focus` outline/ring applied unconditionally causes visual distraction for mouse users, particularly on elements like inputs, checkboxes, and selects. The codebase pattern should strictly use `focus-visible` for custom focus indicators (e.g. `focus-visible:ring-2`) to keep rings visible only for keyboard navigation, while using `focus:outline-none` to remove default browser outlines across all interactions.
**Action:** Replaced native `focus:ring-` and `focus:border-` classes with `focus-visible:ring-` and `focus-visible:border-` in the design system to ensure accessible keyboard navigation without penalizing mouse users.
