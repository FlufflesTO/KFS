## 2025-02-20 - Avoid Multiple Passes on Arrays
**Learning:** Iterating over an array multiple times using methods like `reduce` or `filter` to compute different statistics introduces O(M*N) complexity. In `src/pages/portal/client/dashboard.astro`, the `siteAggregates` array was iterated 4 times to compute 4 totals.
**Action:** Combine multiple aggregation passes into a single loop to calculate all required metrics simultaneously, reducing execution time and overhead.
