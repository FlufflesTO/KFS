# Project Sentinel - Production Safety Reset
# Purpose: Mandates password rotation and MFA for all administrative and operational accounts.
# Authority: Phase 0 Production Readiness

$ErrorActionPreference = "Stop"

$adminEmails = @(
    "admin@tequit.co.za",
    "finance@tequit.co.za",
    "manager@tequit.co.za"
)

$techEmails = @(
    "tech@tequit.co.za"
)

Write-Host "--- KHARON PRODUCTION SAFETY RESET ---" -ForegroundColor Cyan

# 1. Enforce MFA and Password Change for Elevated Roles
foreach ($email in $adminEmails) {
    Write-Host "Securing account: $email" -ForegroundColor Yellow
    npx wrangler d1 execute kharon-portal --remote --command "UPDATE users SET force_password_change = 1, mfa_required = 1 WHERE email = '$email'" --config wrangler.portal.jsonc
}

# 2. Enforce Password Change for Operational Roles
foreach ($email in $techEmails) {
    Write-Host "Rotating credentials for: $email" -ForegroundColor Yellow
    npx wrangler d1 execute kharon-portal --remote --command "UPDATE users SET force_password_change = 1 WHERE email = '$email'" --config wrangler.portal.jsonc
}

Write-Host "--- SAFETY RESET COMPLETE ---" -ForegroundColor Green
Write-Host "Action Required: Impacted users must log in to portal.tequit.co.za to rotate credentials and setup MFA."
