## 2024-05-24 - Efficiently fetch related records with SQLite JSON aggregation
**Learning:** In Cloudflare D1 (SQLite), executing N+1 queries to fetch related child records for a list of parent records is a major performance bottleneck due to network latency.
**Action:** Use JSON aggregation (`json_group_array` and `json_object`) in the SQL query to fetch the parent and all related children in a single database call.
