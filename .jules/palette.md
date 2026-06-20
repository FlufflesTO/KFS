## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2024-05-18 - Improve Button Keyboard Focus Accessibility and Prevent Mouse Distraction
**Learning:** Using `focus:ring` on buttons and interactive elements creates a jarring cyan halo when mouse users click them, but removing the ring entirely fails keyboard accessibility tests. The offset ring should also be 4px instead of 2px to match project design tokens.
**Action:** Always use `focus-visible:` pseudo-class (e.g., `focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal`) instead of `focus:` for focus rings on interactive elements like buttons and toggles to ensure they only trigger during keyboard navigation while avoiding distraction on mouse click.
