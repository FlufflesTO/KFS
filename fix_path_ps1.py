with open("scripts/build-deploy-artifacts.ps1", "r") as f:
    content = f.read()

# The error: `Refusing to operate outside repository root: /home/runner/work/KFS/KFS/src/pages/portal`
# This means $Root is somehow not matching $full.
#
# Let's look at `Assert-RepoChild`:
# $full = [System.IO.Path]::GetFullPath($Path)
# $rootWithSlash = $Root.TrimEnd('\') + '\'
# if (-not ($full -eq $Root -or $full.StartsWith($rootWithSlash, [System.StringComparison]::OrdinalIgnoreCase))) {
#
# On Linux, path separator is `/`. So `$Root.TrimEnd('\') + '\'` might append `\` to a Linux path like `/home/.../KFS\`, causing `StartsWith` to fail.
# Instead of hardcoding `\`, we should use `[System.IO.Path]::DirectorySeparatorChar`.

content = content.replace(
    "$rootWithSlash = $Root.TrimEnd('\\') + '\\'",
    "$rootWithSlash = $Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar"
)

# Wait, `DirectorySeparatorChar` is `/` on Linux. But we should also check if there are other hardcoded slashes.
content = content.replace(
    "$deployRedirect = Join-Path $Root \".wrangler\\deploy\"",
    "$deployRedirect = Join-Path $Root \".wrangler/deploy\""
)
content = content.replace(
    "Join-Path $portalRoot \"server\\wrangler.json\"",
    "Join-Path $portalRoot \"server/wrangler.json\""
)

with open("scripts/build-deploy-artifacts.ps1", "w") as f:
    f.write(content)
