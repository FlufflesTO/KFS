param(
  [string]$Database = "kharon-portal",
  [string]$OutputDir = "retention-reports"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputPath = Join-Path $OutputDir "portal-retention-$timestamp.json"

function Invoke-D1Json {
  param([string]$Sql)

  $raw = npx wrangler d1 execute $Database --remote --json --command $Sql 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "D1 retention query failed: $raw"
  }

  $parsed = $raw | ConvertFrom-Json
  return $parsed[0].results
}

$report = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  database = $Database
  mode = "non-destructive"
  thresholds = [ordered]@{
    jobcardsYears = 7
    financialYears = 7
    maintenanceRequestsYears = 5
    auditEventsYears = 2
    passwordResetDays = 90
    rateLimitDays = 30
  }
  counts = [ordered]@{}
  r2 = [ordered]@{}
  notes = @(
    "This report does not delete or modify D1/R2 records.",
    "Review DATA_RETENTION_POLICY.md before any cleanup decision.",
    "Legal hold overrides every threshold."
  )
}

$report.counts.jobsOlderThan7Years = Invoke-D1Json "SELECT COUNT(*) AS count FROM jobs WHERE created_at < datetime('now', '-7 years');"
$report.counts.financialRecordsOlderThan7Years = Invoke-D1Json "SELECT COUNT(*) AS count FROM financial_records WHERE created_at < datetime('now', '-7 years');"
$report.counts.maintenanceRequestsOlderThan5Years = Invoke-D1Json "SELECT COUNT(*) AS count FROM maintenance_requests WHERE created_at < datetime('now', '-5 years');"
$report.counts.auditEventsOlderThan2Years = Invoke-D1Json "SELECT COUNT(*) AS count FROM audit_events WHERE created_at < datetime('now', '-2 years');"
$report.counts.usedOrExpiredResetTokensOlderThan90Days = Invoke-D1Json "SELECT COUNT(*) AS count FROM password_reset_tokens WHERE (used_at IS NOT NULL OR expires_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) AND created_at < datetime('now', '-90 days');"
$report.counts.rateLimitRowsOlderThan30Days = Invoke-D1Json "SELECT COUNT(*) AS count FROM portal_rate_limits WHERE updated_at < datetime('now', '-30 days');"
$report.counts.photoEvidenceOlderThan7Years = Invoke-D1Json "SELECT COUNT(*) AS count FROM job_evidence_files WHERE created_at < datetime('now', '-7 years');"

$r2Raw = npx wrangler r2 bucket info kharon-portal-storage 2>&1
$r2Text = $r2Raw -join "`n"
$report.r2.bucketInfoCheck = if ($LASTEXITCODE -eq 0) { "ok" } else { "failed" }
$report.r2.bucketInfoOutput = $r2Text.Substring(0, [Math]::Min(4000, $r2Text.Length))
$report.r2.note = "Wrangler verifies bucket availability. Prefix-level object retention review requires scoped R2 S3 credentials and the approved backup tool."

$report | ConvertTo-Json -Depth 8 | Set-Content -Path $outputPath -Encoding UTF8
Write-Host "Retention report written to $outputPath"
