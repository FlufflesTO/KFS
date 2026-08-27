## 2026-08-27 - Toast Close Button Focus States
**Learning:** Floating/utility close buttons (like the 'x' in toast notifications) often miss focus states because their hover states rely on text color changes, which are invisible to keyboard users.
**Action:** Always apply explicit focus-visible rings (`focus-visible:ring-2 focus-visible:ring-kharon-cyan`) to icon-only close buttons to ensure keyboard accessibility.
