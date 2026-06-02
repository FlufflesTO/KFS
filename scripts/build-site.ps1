param(
  [ValidateSet("staging", "production")]
  [string] $Target = "staging"
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot\..")

if ($Target -eq "production") {
  $env:PUBLIC_SITE_URL = "https://www.kharon.co.za"
  $env:PUBLIC_PORTAL_URL = "https://portal.kharon.co.za"
  $env:PUBLIC_CONTACT_EMAIL = "admin@kharon.co.za"
} else {
  $env:PUBLIC_SITE_URL = "https://www.tequit.co.za"
  $env:PUBLIC_PORTAL_URL = "https://portal.tequit.co.za"
  $env:PUBLIC_CONTACT_EMAIL = "admin@kharon.co.za"
}

$env:CF_PAGES = "true"
npm run build

# Reorganize dist for Cloudflare Pages SSR compatibility
# Move all client assets to the root so they are served correctly from /_astro, /brand, etc.
if (Test-Path "dist/client") {
    Write-Host "Merging dist/client into dist root..."
    Copy-Item "dist/client/*" "dist" -Recurse -Force
    Remove-Item "dist/client" -Recurse -Force
}

# Move all server assets to the root and rename entry.mjs to _worker.js
if (Test-Path "dist/server") {
    Write-Host "Merging dist/server into dist root..."
    Copy-Item "dist/server/*" "dist" -Recurse -Force

    if (Test-Path "dist/entry.mjs") {
        Move-Item "dist/entry.mjs" "dist/_worker.js" -Force
    }

    Remove-Item "dist/server" -Recurse -Force
}

exit $LASTEXITCODE
