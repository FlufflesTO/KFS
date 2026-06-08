param(
  [string] $ArtifactPath = ".deploy/website"
)

# KFS website Pages artifact deploy wrapper.
# Keeps Wrangler from reusing generated Worker deploy redirects from prior Astro builds.

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path "$PSScriptRoot/..").Path
Set-Location -LiteralPath $Root

$deployRedirect = Join-Path $Root ".wrangler/deploy"
if (Test-Path -LiteralPath $deployRedirect) {
  Remove-Item -LiteralPath $deployRedirect -Recurse -Force
}

$artifactFullPath = Join-Path $Root $ArtifactPath

npx wrangler pages deploy $artifactFullPath --project-name kfs-website --branch main
if ($LASTEXITCODE -ne 0) {
  throw "Website Pages artifact deploy failed with exit code $LASTEXITCODE"
}
