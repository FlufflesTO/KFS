# KFS Cloudflare Pages compatibility wrapper.
# Prefer scripts/build-deploy-artifacts.ps1 for new deploy flows.

param(
  [ValidateSet("production")]
  [string] $Target = "production"
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot/..")

pwsh -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/build-deploy-artifacts.ps1" website
exit $LASTEXITCODE
