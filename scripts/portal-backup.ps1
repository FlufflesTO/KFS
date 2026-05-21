param(
  [string] $D1Database = "kharon-portal",
  [string] $R2Bucket = "kharon-portal-storage",
  [string] $OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$d1Output = Join-Path $OutputDir "$D1Database-$timestamp.sql"
$manifestOutput = Join-Path $OutputDir "$D1Database-$timestamp-manifest.json"

npx wrangler d1 export $D1Database --remote --output $d1Output --skip-confirmation

$r2Info = npx wrangler r2 bucket info $R2Bucket 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "R2 bucket info failed for $R2Bucket"
}

$manifest = [pscustomobject]@{
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  d1Database = $D1Database
  d1ExportPath = (Resolve-Path $d1Output).Path
  r2Bucket = $R2Bucket
  r2AvailabilityOutput = ($r2Info -join "`n")
  r2EvidenceBackupNote = "Use the documented S3-compatible R2 mirror procedure with credentials supplied outside the repository."
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestOutput -Encoding UTF8
$manifest | ConvertTo-Json -Depth 6
