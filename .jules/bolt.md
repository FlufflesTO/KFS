## 2024-06-05 - [Image Optimization: native lazy loading missing]
**Learning:** This Astro application had many `<img>` tags missing native `loading="lazy"` and `decoding="async"`, missing a clear optimization opportunity. Some hero images should be `loading="eager"`.
**Action:** Add these attributes natively across all `<img>` elements that do not already define them.
