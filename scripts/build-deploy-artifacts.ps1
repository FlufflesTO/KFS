# KFS Cloudflare deployment artifact builder
# Builds portal and website targets into separate deploy directories.

param(
  [ValidateSet("portal", "website", "all", "production")]
  [string] $Target = "all"
)

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path "$PSScriptRoot/..").Path
Set-Location -LiteralPath $Root

$DeployRoot = Join-Path $Root ".deploy"
$DistRoot = Join-Path $Root "dist"
$WebsiteSourceBackupRoot = Join-Path $Root ".website-build-excluded"
$WebsiteExcludedSources = @(
  "src/pages/portal",
  "src/pages/api",
  "src/pages/health.json.ts",
  "public/sw.js",
  "public/manifest.webmanifest",
  "public/offline.html"
)

function Assert-RepoChild {
  param([Parameter(Mandatory = $true)][string] $Path)

  $full = [System.IO.Path]::GetFullPath($Path)
  $rootWithSlash = $Root.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
  if (-not ($full -eq $Root -or $full.StartsWith($rootWithSlash, [System.StringComparison]::OrdinalIgnoreCase))) {
    throw "Refusing to operate outside repository root: $full"
  }
  return $full
}

function Reset-Directory {
  param([Parameter(Mandatory = $true)][string] $Path)

  $full = Assert-RepoChild $Path
  if (Test-Path -LiteralPath $full) {
    Remove-Item -LiteralPath $full -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $full | Out-Null
}

function Restore-WebsiteSourceExclusions {
  foreach ($relativePath in $WebsiteExcludedSources) {
    $sourcePath = Assert-RepoChild (Join-Path $Root $relativePath)
    $backupPath = Assert-RepoChild (Join-Path $WebsiteSourceBackupRoot $relativePath)
    if (Test-Path -LiteralPath $backupPath) {
      if (Test-Path -LiteralPath $sourcePath) {
        $backupItem = Get-Item -LiteralPath $backupPath
        $sourceItem = Get-Item -LiteralPath $sourcePath
        if ($backupItem.PSIsContainer -or $sourceItem.PSIsContainer) {
          throw "Cannot restore website build exclusion because source path already exists: $sourcePath"
        }
        Remove-Item -LiteralPath $sourcePath -Force
      }
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $sourcePath) | Out-Null
      Move-Item -LiteralPath $backupPath -Destination $sourcePath -Force
    }
  }

  if (Test-Path -LiteralPath $WebsiteSourceBackupRoot) {
    Remove-Item -LiteralPath (Assert-RepoChild $WebsiteSourceBackupRoot) -Recurse -Force
  }
}

function Invoke-WithWebsiteSourceExclusions {
  param([Parameter(Mandatory = $true)][scriptblock] $ScriptBlock)

  Restore-WebsiteSourceExclusions
  Reset-Directory $WebsiteSourceBackupRoot

  try {
    foreach ($relativePath in $WebsiteExcludedSources) {
      $sourcePath = Assert-RepoChild (Join-Path $Root $relativePath)
      if (-not (Test-Path -LiteralPath $sourcePath)) {
        continue
      }

      $backupPath = Assert-RepoChild (Join-Path $WebsiteSourceBackupRoot $relativePath)
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backupPath) | Out-Null
      Move-Item -LiteralPath $sourcePath -Destination $backupPath -Force
    }

    & $ScriptBlock
  } finally {
    Restore-WebsiteSourceExclusions
  }
}

function Copy-DirectoryContents {
  param(
    [Parameter(Mandatory = $true)][string] $Source,
    [Parameter(Mandatory = $true)][string] $Destination
  )

  $sourceFull = Assert-RepoChild $Source
  $destinationFull = Assert-RepoChild $Destination
  if (-not (Test-Path -LiteralPath $sourceFull)) {
    throw "Missing source directory: $sourceFull"
  }
  New-Item -ItemType Directory -Force -Path $destinationFull | Out-Null
  Get-ChildItem -LiteralPath $sourceFull -Force |
    Copy-Item -Destination $destinationFull -Recurse -Force
}

function Remove-DevVars {
  param([Parameter(Mandatory = $true)][string] $Path)

  Get-ChildItem -LiteralPath (Assert-RepoChild $Path) -Recurse -Force -Filter ".dev.vars" -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
}

function Remove-WranglerDeployRedirect {
  $deployRedirect = Join-Path $Root ".wrangler/deploy"
  if (Test-Path -LiteralPath $deployRedirect) {
    Remove-Item -LiteralPath (Assert-RepoChild $deployRedirect) -Recurse -Force
  }
}

function Set-TargetEnvironment {
  param([Parameter(Mandatory = $true)][string] $BuildTarget)

  $env:BUILD_TARGET = $BuildTarget
  $env:PUBLIC_DEPLOY_TARGET = $BuildTarget
  $env:PUBLIC_SITE_URL = "https://www.tequit.co.za"
  $env:PUBLIC_PORTAL_URL = "https://portal.tequit.co.za"
  $env:PUBLIC_CONTACT_EMAIL = "admin@kharon.co.za"

  if ($BuildTarget -eq "website") {
    $env:CF_PAGES = "true"
  } else {
    Remove-Item Env:CF_PAGES -ErrorAction SilentlyContinue
  }
}

function Invoke-TargetBuild {
  param([Parameter(Mandatory = $true)][string] $BuildTarget)

  Write-Host "Building $BuildTarget target..."
  if (Test-Path -LiteralPath $DistRoot) {
    Remove-Item -LiteralPath (Assert-RepoChild $DistRoot) -Recurse -Force
  }

  Set-TargetEnvironment $BuildTarget
  if ($BuildTarget -eq "website") {
    npm run build:astro
    if ($LASTEXITCODE -ne 0) {
      throw "$BuildTarget Astro build failed with exit code $LASTEXITCODE"
    }
    npm run build:cron
    if ($LASTEXITCODE -ne 0) {
      throw "$BuildTarget cron build failed with exit code $LASTEXITCODE"
    }
    npm run build:css
  } else {
    npm run build
  }
  if ($LASTEXITCODE -ne 0) {
    throw "$BuildTarget build failed with exit code $LASTEXITCODE"
  }
}

function Build-PortalArtifact {
  Invoke-TargetBuild "portal"

  $portalRoot = Join-Path $DeployRoot "portal"
  Reset-Directory $portalRoot
  Copy-DirectoryContents (Join-Path $DistRoot "client") (Join-Path $portalRoot "client")
  Copy-DirectoryContents (Join-Path $DistRoot "server") (Join-Path $portalRoot "server")
  Remove-DevVars $portalRoot

  if (-not (Test-Path -LiteralPath (Join-Path $portalRoot "server/wrangler.json"))) {
    throw "Portal artifact is missing server/wrangler.json."
  }
}

function Build-WebsiteArtifact {
  Invoke-WithWebsiteSourceExclusions {
    Invoke-TargetBuild "website"
  }

  $websiteRoot = Join-Path $DeployRoot "website"
  Reset-Directory $websiteRoot
  Copy-DirectoryContents (Join-Path $DistRoot "client") $websiteRoot
  Copy-DirectoryContents (Join-Path $DistRoot "server") $websiteRoot
  Remove-DevVars $websiteRoot

  $entry = Join-Path $websiteRoot "entry.mjs"
  $worker = Join-Path $websiteRoot "_worker.js"
  if (Test-Path -LiteralPath $entry) {
    Move-Item -LiteralPath $entry -Destination $worker -Force
  }

  $generatedWrangler = Join-Path $websiteRoot "wrangler.json"
  if (Test-Path -LiteralPath $generatedWrangler) {
    Remove-Item -LiteralPath $generatedWrangler -Force
  }

  foreach ($portalOnlyAsset in @("sw.js", "manifest.webmanifest", "offline.html")) {
    $assetPath = Join-Path $websiteRoot $portalOnlyAsset
    if (Test-Path -LiteralPath $assetPath) {
      Remove-Item -LiteralPath $assetPath -Force
    }
  }

  if (-not (Test-Path -LiteralPath $worker)) {
    throw "Website artifact is missing _worker.js."
  }

  Remove-WranglerDeployRedirect
}

if ($Target -eq "production") {
  $Target = "all"
}

Restore-WebsiteSourceExclusions

if ($Target -eq "all") {
  Reset-Directory $DeployRoot
  Build-PortalArtifact
  Build-WebsiteArtifact
} elseif ($Target -eq "portal") {
  Build-PortalArtifact
} elseif ($Target -eq "website") {
  Build-WebsiteArtifact
}

Write-Host "Deployment artifacts ready under .deploy."
