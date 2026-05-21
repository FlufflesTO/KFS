param(
  [string] $PublicUrl = "https://www.tequit.co.za/",
  [string] $PortalLoginUrl = "https://portal.tequit.co.za/portal/login",
  [string] $ProtectedDashboardUrl = "https://portal.tequit.co.za/portal/admin/dashboard",
  [string] $D1Database = "kharon-portal",
  [string] $R2Bucket = "kharon-portal-storage",
  [string] $OutputDir = "monitor-results"
)

$ErrorActionPreference = "Stop"

function New-Result($Name, $Ok, $Details) {
  [pscustomobject]@{
    name = $Name
    ok = [bool] $Ok
    details = $Details
  }
}

function Test-HttpStatus($Name, $Url, [int[]] $AllowedStatuses) {
  try {
    $response = curl.exe -I -L --max-time 20 --silent --show-error --write-out "`n%{http_code}" $Url
    $status = [int]($response | Select-Object -Last 1)
    return New-Result $Name ($AllowedStatuses -contains $status) @{ url = $Url; status = $status }
  } catch {
    return New-Result $Name $false @{ url = $Url; error = $_.Exception.Message }
  }
}

function Test-HttpRedirect($Name, $Url, [string] $ExpectedLocationContains) {
  try {
    $response = curl.exe -I --max-time 20 --silent --show-error $Url
    $statusLine = $response | Select-String -Pattern "^HTTP/"
    $locationLine = $response | Select-String -Pattern "^Location:"
    $status = if ($statusLine) { [int](([string]$statusLine[-1]).Split(" ")[1]) } else { 0 }
    $location = if ($locationLine) { ([string]$locationLine[-1]).Substring(9).Trim() } else { "" }
    return New-Result $Name ($status -eq 302 -and $location.Contains($ExpectedLocationContains)) @{ url = $Url; status = $status; location = $location }
  } catch {
    return New-Result $Name $false @{ url = $Url; error = $_.Exception.Message }
  }
}

function Test-D1Availability($Database) {
  try {
    $output = npx wrangler d1 execute $Database --remote --command "SELECT COUNT(*) AS user_count FROM users;" 2>&1
    $ok = $LASTEXITCODE -eq 0 -and (($output -join "`n") -match "user_count")
    return New-Result "d1_availability" $ok @{ database = $Database; output = ($output -join "`n") }
  } catch {
    return New-Result "d1_availability" $false @{ database = $Database; error = $_.Exception.Message }
  }
}

function Test-R2Availability($Bucket) {
  try {
    $output = npx wrangler r2 bucket info $Bucket 2>&1
    $ok = $LASTEXITCODE -eq 0 -and (($output -join "`n") -match $Bucket)
    return New-Result "r2_availability" $ok @{ bucket = $Bucket; output = ($output -join "`n") }
  } catch {
    return New-Result "r2_availability" $false @{ bucket = $Bucket; error = $_.Exception.Message }
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$results = @(
  (Test-HttpStatus "public_home" $PublicUrl @(200)),
  (Test-HttpStatus "portal_login" $PortalLoginUrl @(200)),
  (Test-HttpRedirect "protected_dashboard_redirect" $ProtectedDashboardUrl "/portal/login"),
  (Test-D1Availability $D1Database),
  (Test-R2Availability $R2Bucket)
)

$summary = [pscustomobject]@{
  checkedAt = (Get-Date).ToUniversalTime().ToString("o")
  ok = -not ($results | Where-Object { -not $_.ok })
  results = $results
}

$outputFile = Join-Path $OutputDir "portal-monitor-$timestamp.json"
$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $outputFile -Encoding UTF8
$summary | ConvertTo-Json -Depth 8

if (-not $summary.ok) {
  Write-Error "Portal monitoring check failed. See $outputFile"
}
