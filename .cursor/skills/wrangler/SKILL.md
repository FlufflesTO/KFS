---
name: wrangler
description: Guidelines for managing Cloudflare D1 migrations, executing SQL statements, verifying local environment bindings, and running wrangler commands on the portal and website. Use when modifying DB schemas, creating migrations, or running wrangler CLI scripts.
---

# Wrangler & Cloudflare D1/R2 Local Development guidelines

This project deploys split workers (`kfs-portal` and `kfs-website`) defined in `wrangler.portal.jsonc` and `wrangler.website.jsonc` respectively.

## Common Operations

1. **Local Database Migrations**: Apply local D1 migrations using:
   ```bash
   npx wrangler d1 migrations apply kharon-portal --local --config wrangler.portal.jsonc
   ```
2. **Execute SQL Locally**:
   ```bash
   npx wrangler d1 execute kharon-portal --local --config wrangler.portal.jsonc --command "SELECT * FROM users"
   # Or from a file:
   npx wrangler d1 execute kharon-portal --local --config wrangler.portal.jsonc --file seed-users.sql
   ```
3. **Database Access Bindings**: Access databases via `@server/bindings` rather than context:
   ```ts
   import { getDatabase } from "@server/bindings";
   const db = getDatabase();
   ```
4. **Soft-Delete Enforcement**: Ensure all database queries include `deleted_at IS NULL` unless explicitly bypassed.
