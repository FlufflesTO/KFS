## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-11 - Adding Keyboard Focus States to Floating Close Buttons
**Learning:** Custom floating or absolute-positioned close buttons (like "x" icons in modals, drawers, or toasts) often lack default browser focus indicators, making them invisible to keyboard-only users.
**Action:** Always add explicit `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color] focus-visible:ring-offset-[size]` classes alongside standard hover effects to ensure proper accessibility for these elements.
