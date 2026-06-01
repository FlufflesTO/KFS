## 2026-06-01 - Added missing aria-labels on icon-only close buttons
**Learning:** In Astro components, the "x" close buttons for toasts, mobile drawers, and feedback form dialogs were missing `aria-label`s making them inaccessible to screen readers since they did not have visible text.
**Action:** Adding `aria-label="Close notification"` and similarly named labels improved the screen reader accessibility.
