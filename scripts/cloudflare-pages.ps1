# Project Sentinel - Cloudflare Pages Deployment Utility
# Purpose: Manages project creation, login, domains, and environment deployment routing for Cloudflare Pages.
# Dependencies: wrangler, Node.js
# Structural Role: DevOps deployment script helper for environment sync.

param(
  [ValidateSet("login", "whoami", "list", "create", "domains", "retry-portal", "check-portal", "production")]
  [string] $Action = "whoami"
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot/..")

$ProjectName = "kfs-website"
$WebsiteProjectName = $ProjectName
$PortalDomain = "portal.tequit.co.za"
$AccountId = if ($env:CLOUDFLARE_ACCOUNT_ID) { $env:CLOUDFLARE_ACCOUNT_ID } else { "1b6ad8d0efcc066f4689065f5f24f5f9" }

if ($env:CLOUDFLARE_API_TOKEN) {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Write-Host "Ignored CLOUDFLARE_API_TOKEN for this command so Wrangler can use OAuth."
}

function Get-WranglerOAuthToken {
  $configPath = Join-Path $env:USERPROFILE ".wrangler/config/default.toml"
  if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Wrangler OAuth config was not found. Run npm run auth:cloudflare first."
  }

  $config = Get-Content -LiteralPath $configPath -Raw
  if ($config -notmatch 'oauth_token\s*=\s*"([^"]+)"') {
    throw "Wrangler OAuth token was not found. Run npm run auth:cloudflare first."
  }

  return $Matches[1]
}

function Invoke-CloudflareApi {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Method,

    [Parameter(Mandatory = $true)]
    [string] $Path,

    [object] $Body = $null
  )

  $token = Get-WranglerOAuthToken
  $headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  }
  $uri = "https://api.cloudflare.com/client/v4$Path"

  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  }

  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body ($Body | ConvertTo-Json)
}

function Show-PagesDomains {
  $path = "/accounts/$AccountId/pages/projects/$ProjectName/domains"
  $domains = Invoke-CloudflareApi -Method Get -Path $path
  $domains.result | Select-Object name,status,
    @{Name = "validation"; Expression = { $_.validation_data.status }},
    @{Name = "verification"; Expression = { $_.verification_data.status }},
    @{Name = "verification_error"; Expression = { $_.verification_data.error_message }}
}

switch ($Action) {
  "login" {
    npx wrangler login
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    npx wrangler whoami
    exit $LASTEXITCODE
  }
  "whoami" {
    npx wrangler whoami
    exit $LASTEXITCODE
  }
  "list" {
    npx wrangler pages project list
    exit $LASTEXITCODE
  }
  "create" {
    npx wrangler pages project create $ProjectName --production-branch main --compatibility-date 2026-05-18
    exit $LASTEXITCODE
  }
  "domains" {
    Show-PagesDomains
    exit 0
  }
  "retry-portal" {
    $path = "/accounts/$AccountId/pages/projects/$ProjectName/domains/$PortalDomain"
    Invoke-CloudflareApi -Method Patch -Path $path | Out-Null
    Show-PagesDomains
    exit 0
  }
  "check-portal" {
    Resolve-DnsName $PortalDomain -ErrorAction SilentlyContinue | Select-Object Name,Type,NameHost,IPAddress
    curl.exe -I "https://$PortalDomain/"
    exit $LASTEXITCODE
  }
  "production" {
    npm run build:production
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    npx wrangler deploy --config .deploy/portal/server/wrangler.json
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    # Remove wrangler deploy config if created to prevent deployment redirection errors
    Remove-Item -Path "$PSScriptRoot/../.wrangler/deploy" -Recurse -Force -ErrorAction SilentlyContinue
    npx wrangler pages deploy .deploy/website --project-name $WebsiteProjectName --branch main
    exit $LASTEXITCODE
  }
}
