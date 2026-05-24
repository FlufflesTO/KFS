param(
  [string]$BaseUrl = "https://portal.tequit.co.za",
  [switch]$SkipCredentialTests,
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$knownCredentialVariables = @(
  "KHARON_QA_ADMIN_EMAIL",
  "KHARON_QA_ADMIN_PASSWORD",
  "KHARON_QA_TECH_EMAIL",
  "KHARON_QA_TECH_PASSWORD",
  "KHARON_QA_FINANCE_EMAIL",
  "KHARON_QA_FINANCE_PASSWORD",
  "KHARON_QA_CLIENT_EMAIL",
  "KHARON_QA_CLIENT_PASSWORD"
)

function Join-Url {
  param([string]$Base, [string]$Path)
  return $Base.TrimEnd("/") + "/" + $Path.TrimStart("/")
}

function New-Result {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Detail = ""
  )

  [pscustomobject]@{
    name = $Name
    status = $Status
    detail = $Detail
  }
}

function New-PortalSession {
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.AllowAutoRedirect = $false
  $handler.CookieContainer = [System.Net.CookieContainer]::new()
  $client = [System.Net.Http.HttpClient]::new($handler)
  return [pscustomobject]@{
    Handler = $handler
    Client = $client
  }
}

function Invoke-PortalRequest {
  param(
    [string]$Method = "GET",
    [string]$Path,
    [object]$Body = $null,
    [object]$Session = $null,
    [hashtable]$Headers = @{},
    [int]$MaximumRedirection = 0
  )

  $activeSession = $Session
  if (-not $activeSession) {
    $activeSession = New-PortalSession
  }

  $message = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($Method), (Join-Url $BaseUrl $Path))

  foreach ($key in $Headers.Keys) {
    [void]$message.Headers.TryAddWithoutValidation($key, [string]$Headers[$key])
  }

  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 8
    $message.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, "application/json")
  }

  $response = $activeSession.Client.SendAsync($message).GetAwaiter().GetResult()
  $content = ""
  if ($response.Content) {
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  }

  $headerMap = @{}
  foreach ($header in $response.Headers.GetEnumerator()) {
    $headerMap[$header.Key] = ($header.Value -join ", ")
  }
  if ($response.Content) {
    foreach ($header in $response.Content.Headers.GetEnumerator()) {
      $headerMap[$header.Key] = ($header.Value -join ", ")
    }
  }

  return [pscustomobject]@{
    StatusCode = [int]$response.StatusCode
    Headers = $headerMap
    Content = $content
  }
}

function Get-StatusCode {
  param([object]$Response)
  return [int]$Response.StatusCode
}

function Get-HeaderValue {
  param([object]$Response, [string]$Name)
  if ($Response.Headers -and $Response.Headers[$Name]) {
    return [string]$Response.Headers[$Name]
  }
  return ""
}

function Assert-Status {
  param([string]$Name, [object]$Response, [int[]]$Expected)
  $status = Get-StatusCode $Response
  if ($Expected -contains $status) {
    return New-Result $Name "PASS" "HTTP $status"
  }
  return New-Result $Name "FAIL" "Expected $($Expected -join '/') but received HTTP $status"
}

function Read-JsonResponse {
  param([object]$Response)
  if ($Response.Content) {
    return $Response.Content | ConvertFrom-Json
  }
  return $null
}

function Get-CsrfTokenFromPage {
  param([string]$Html)
  $match = [regex]::Match($Html, '<meta\s+name="kharon-csrf-token"\s+content="([^"]*)"', "IgnoreCase")
  if ($match.Success) {
    return [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value)
  }
  return ""
}

function Get-RoleConfig {
  param([string]$Role)
  $prefix = "KHARON_QA_" + $Role.ToUpperInvariant()
  return [pscustomobject]@{
    Role = $Role
    Email = [Environment]::GetEnvironmentVariable("${prefix}_EMAIL")
    Password = [Environment]::GetEnvironmentVariable("${prefix}_PASSWORD")
    MfaCode = [Environment]::GetEnvironmentVariable("${prefix}_MFA")
  }
}

function Get-ExpectedDashboard {
  param([string]$Role)
  switch ($Role) {
    "admin" { return "/portal/admin/dashboard" }
    "tech" { return "/portal/tech/dashboard" }
    "finance" { return "/portal/finance/dashboard" }
    "client" { return "/portal/client/dashboard" }
  }
}

function Test-Role {
  param([object]$Config)

  $roleResults = @()
  if (-not $Config.Email -or -not $Config.Password) {
    $roleResults += New-Result "credential presence: $($Config.Role)" "SKIP" "Set KHARON_QA_$($Config.Role.ToUpperInvariant())_EMAIL and KHARON_QA_$($Config.Role.ToUpperInvariant())_PASSWORD outside the repo."
    return $roleResults
  }

  $session = New-PortalSession
  $authResponse = Invoke-PortalRequest -Method "POST" -Path "/portal/api/auth" -Body @{
    email = $Config.Email
    password = $Config.Password
    mfaCode = $Config.MfaCode
  } -Session $session -MaximumRedirection 0

  $roleResults += Assert-Status "login: $($Config.Role)" $authResponse @(200)

  if ((Get-StatusCode $authResponse) -ne 200) {
    return $roleResults
  }

  $body = Read-JsonResponse $authResponse
  $expectedDashboard = Get-ExpectedDashboard $Config.Role
  if ($body.redirectTo -eq $expectedDashboard -or $body.redirectTo -eq "/portal/account/password" -or $body.redirectTo -eq "/portal/account/mfa") {
    $roleResults += New-Result "role redirect: $($Config.Role)" "PASS" "redirectTo=$($body.redirectTo)"
  } else {
    $roleResults += New-Result "role redirect: $($Config.Role)" "FAIL" "Expected $expectedDashboard, password rotation, or MFA setup. Received $($body.redirectTo)"
  }

  if ($body.redirectTo -eq $expectedDashboard) {
    $dashboard = Invoke-PortalRequest -Path $expectedDashboard -Session $session -MaximumRedirection 0
    $roleResults += Assert-Status "allowed dashboard: $($Config.Role)" $dashboard @(200)

    $csrf = Get-CsrfTokenFromPage $dashboard.Content
    if ($csrf) {
      $roleResults += New-Result "CSRF token exposure: $($Config.Role)" "PASS" "Token present in authenticated portal layout."
      $csrfBlocked = Invoke-PortalRequest -Method "POST" -Path "/portal/api/logout" -Body @{} -Session $session -MaximumRedirection 0
      $roleResults += Assert-Status "missing CSRF blocked: $($Config.Role)" $csrfBlocked @(403)

      $logout = Invoke-PortalRequest -Method "POST" -Path "/portal/api/logout" -Body @{} -Session $session -Headers @{ "x-csrf-token" = $csrf } -MaximumRedirection 0
      $roleResults += Assert-Status "valid CSRF logout: $($Config.Role)" $logout @(200)
    } else {
      $roleResults += New-Result "CSRF token exposure: $($Config.Role)" "FAIL" "Authenticated dashboard did not expose meta token."
    }
  }

  return $roleResults
}

$results = @()

$login = Invoke-PortalRequest -Path "/portal/login" -MaximumRedirection 0
$results += Assert-Status "login route reachable" $login @(200)

foreach ($route in @("/portal/tech/dashboard", "/portal/admin/dashboard", "/portal/finance/dashboard", "/portal/client/dashboard")) {
  $response = Invoke-PortalRequest -Path $route -MaximumRedirection 0
  $status = Get-StatusCode $response
  $location = Get-HeaderValue $response "Location"
  if ($status -eq 302 -and $location -match "/portal/login") {
    $results += New-Result "unauthenticated redirect: $route" "PASS" "HTTP 302 to login"
  } else {
    $results += New-Result "unauthenticated redirect: $route" "FAIL" "Expected 302 to login, received HTTP $status Location=$location"
  }
}

$traversal = Invoke-PortalRequest -Path "/portal/%2e%2e/admin/dashboard" -MaximumRedirection 0
$traversalStatus = Get-StatusCode $traversal
if ($traversalStatus -eq 400 -or $traversalStatus -eq 302 -or $traversalStatus -eq 404) {
  $results += New-Result "encoded traversal handling" "PASS" "HTTP $traversalStatus"
} else {
  $results += New-Result "encoded traversal handling" "FAIL" "Unexpected HTTP $traversalStatus"
}

if (-not $SkipCredentialTests) {
  foreach ($role in @("admin", "tech", "finance", "client")) {
    $results += Test-Role (Get-RoleConfig $role)
  }
}

$failed = @($results | Where-Object { $_.status -eq "FAIL" })
$summary = [pscustomobject]@{
  ok = $failed.Count -eq 0
  baseUrl = $BaseUrl
  generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  results = $results
}

$json = $summary | ConvertTo-Json -Depth 8
if ($OutputPath) {
  $directory = Split-Path -Parent $OutputPath
  if ($directory -and -not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
  Set-Content -Path $OutputPath -Value $json -Encoding UTF8
}

$json

if ($failed.Count -gt 0) {
  exit 1
}
