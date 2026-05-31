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

# Move Cloudflare control files to dist root for Pages compatibility
if (Test-Path "dist/client/_headers") { Copy-Item "dist/client/_headers" "dist/_headers" -Force }
if (Test-Path "dist/client/_redirects") { Copy-Item "dist/client/_redirects" "dist/_redirects" -Force }

exit $LASTEXITCODE
