# Standard Operating Procedure: Backup & Recovery

**Status:** Production Ready
**Authority:** Phase 0 Production Readiness
**Scope:** Kharon Portal Data (D1) and Documents (R2)

---

## 1. D1 Database Backups

### 1.1 Automated Backups (CI/CD)
The GitHub Actions pipeline (`ci-cd.yml`) automatically exports the D1 database before applying any migrations.
- **Frequency:** Every push to `main`.
- **Retention:** GitHub Workflow Artifacts (default 90 days).
- **Tool:** `npx wrangler d1 export`

### 1.2 Manual Backups
Administrators can trigger a manual export using the provided PowerShell script:
```powershell
./scripts/portal-backup.ps1 -D1Database "kharon-portal" -OutputDir "backups"
```
This produces a SQL export and a JSON manifest in the `backups/` directory.

### 1.3 Recovery Procedure
To restore a D1 database from a SQL export:
1.  **Identify Export:** Locate the desired `.sql` file in GitHub Artifacts or local backups.
2.  **Verify Schema:** Ensure the target database schema matches the export version.
3.  **Execute Restore:**
    ```bash
    npx wrangler d1 execute kharon-portal --remote --file "./backups/your-export.sql"
    ```
    *Note: This will overwrite existing data. Exercise extreme caution.*

---

## 2. R2 Document Backups

### 2.1 Mirroring Strategy
R2 buckets do not support native SQL-style exports. Kharon utilizes an S3-compatible mirror strategy for the `kharon-portal-storage` bucket.

### 2.2 Manual Sync
Use `rclone` or a similar S3-compatible tool with external credentials to mirror the bucket:
```bash
rclone sync cloudflare:kharon-portal-storage /local/backup/path --progress
```

### 2.3 Recovery Procedure
To restore missing files to R2:
```bash
npx wrangler r2 object put kharon-portal-storage/path/to/file --file "./local/file"
```

---

## 3. Secret Management

### 3.1 Cloudflare Secrets
All production secrets (API keys, private tokens) must be stored in Cloudflare and NEVER in the codebase.
- **Set Secret:** `npx wrangler secret put SECRET_NAME`
- **Audit:** Ensure no `.env` files are committed and no secrets appear in `grep` scans.

---

## 4. Verification Registry

| Resource | Backup Method | Verification Tool |
| :--- | :--- | :--- |
| **D1 Portal** | `wrangler d1 export` | `wrangler d1 execute --command "SELECT count(*) FROM users"` |
| **R2 Storage** | S3 Mirroring | `wrangler r2 bucket info kharon-portal-storage` |
| **Secrets** | Wrangler Secrets | `wrangler secret list` |
