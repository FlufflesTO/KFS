## 2026-06-08 - WebKit Headless getComputedStyle Pseudo-Element Bug

**Learning:** When using Playwright with WebKit in a headless environment, `window.getComputedStyle(el, '::before')` fails to correctly report the styles applied via the `::before` pseudo-element, instead returning empty or default values. This is a known upstream bug in WebKit's headless implementation.

**Action:** When writing tests that verify pseudo-element styling, we must either parse the raw CSS rules from `document.styleSheets` directly, or more commonly, skip these specific style checks for the `webkit` and `mobile-safari` project targets in Playwright to avoid false negatives, until the upstream bug is resolved.
