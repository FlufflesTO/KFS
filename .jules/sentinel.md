## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-09-24 - Strict Regex Sanitization for Storage APIs
**Vulnerability:** Path traversal in file fetch endpoints. A basic `includes('..')` check on storage parameters can be bypassed with URL encoding, null bytes, or unexpected path constructions depending on the environment, allowing access to unintended files or directories.
**Learning:** Relying on negative lookups (e.g., checking for `..`) is less secure than positive lookups (e.g., validating against an allowlist).
**Prevention:** Use a strict allowlist regex (e.g., `/^[a-zA-Z0-9_\-\.\/]+$/`) for any parameter directly influencing file path lookups to ensure only valid, expected characters are parsed.
