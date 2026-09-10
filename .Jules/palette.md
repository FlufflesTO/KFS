## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-09-10 - Added focus state on native summary tags
**Learning:** Native interactive elements like <summary> need explicit focus states to ensure keyboard accessibility, especially when they visually represent clickable UI links but use custom styling that overrides the browser default focus rings.
**Action:** Always check dropdown headers and summary tags for explicit focus styles.
