# Project Sentinel - Cloudflare Pages Site Build & Reorganization
# Purpose: Prepares built client/server assets for Cloudflare Pages SSR and routing compatibility.
# Dependencies: Node.js, Astro CLI
# Structural Role: DevOps build post-processor.

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

# Allow skipping the build step when dist/ already exists from a prior build
# (e.g., during deploy:cloudflare where npm run build is called first)
if ($env:SKIP_BUILD -eq "true" -and (Test-Path "dist/server")) {
  Write-Host "SKIP_BUILD=true and dist/server exists. Skipping npm run build."
} else {
  npm run build
}

# Reorganize dist for Cloudflare Pages SSR compatibility
# Move all client assets to the root so they are served correctly from /_astro, /brand, etc.
function Safe-Remove-Directory($Path) {
    if (Test-Path $Path) {
        for ($i = 1; $i -le 3; $i++) {
            try {
                Remove-Item $Path -Recurse -Force -ErrorAction Stop
                return
            } catch {
                Write-Host "Retry ${i}: Failed to remove $Path. Waiting 1 second..."
                Start-Sleep -Seconds 1
            }
        }
        try {
            $trashName = "$Path-trash-$(Get-Random)"
            Write-Host "Failed to remove $Path directly. Attempting to rename to $trashName..."
            Rename-Item -Path $Path -NewName (Split-Path $trashName -Leaf) -Force
            Remove-Item $trashName -Recurse -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Warning: Could not rename or remove ${Path}. Error: $_"
        }
    }
}

if (Test-Path "dist/client") {
    Write-Host "Merging dist/client into dist root..."
    Copy-Item "dist/client/*" "dist" -Recurse -Force
    Safe-Remove-Directory "dist/client"
}

# Move all server assets to the root and rename entry.mjs to _worker.js
if (Test-Path "dist/server") {
    Write-Host "Merging dist/server into dist root..."
    Copy-Item "dist/server/*" "dist" -Recurse -Force

    if (Test-Path "dist/entry.mjs") {
        Move-Item "dist/entry.mjs" "dist/_worker.js" -Force
    }

    Safe-Remove-Directory "dist/server"
}

# Remove wrangler deploy config redirect cache if it exists to prevent pages deployment errors
if (Test-Path ".wrangler/deploy") {
    Write-Host "Removing wrangler deploy config redirect cache..."
    Remove-Item -Path ".wrangler/deploy" -Recurse -Force -ErrorAction SilentlyContinue
}

exit $LASTEXITCODE
