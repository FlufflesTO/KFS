## 2025-06-08 - Added cleanEmail unit tests

**What:** Implemented unit tests for the `cleanEmail` validation utility function.
**Why:** It's a pure string-processing function utilizing simple regex logic for email validation, and unit tests help prevent future regressions.
**Impact:** Improved test coverage and reliability for core string utilities.
**Measurement:** 14 unit test assertions verify happy paths and all major edge cases (empty strings, non-strings, lengths > 160). Tests execute consistently in ~10ms via Playwright.
