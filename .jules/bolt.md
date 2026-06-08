## 2024-06-08 - Unit Tests for cleanText

**What:** Added unit tests for the `cleanText` validation logic in `src/lib/server/access.ts`.
**Coverage:**
- Handling of empty values.
- Trimming the input values before checking lengths.
- Testing boundaries for `min` and `max` constraints.
- Correct conversion logic of `numeric` and `boolean` types to strings, checking the truthy values are formatted properly and falsy parameters like 0 return a generic empty string if `min: 0`.
- Handling `required: true` configuration in correlation with `min: 0` constraints.
**Result:** Better testing coverage for data validations.
