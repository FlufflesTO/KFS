# Portal Role QA Checklist

Use this checklist against staging credentials supplied outside the repository. Do not write passwords, session cookies or temporary secrets into this file.

## Automated Harness

Run the non-secret smoke checks first:

```powershell
npm run portal:qa:roles -- -SkipCredentialTests
```

Run credential-backed role checks only with credentials supplied through environment variables outside the repository:

```powershell
$env:KHARON_QA_ADMIN_EMAIL = "admin@example.co.za"
$env:KHARON_QA_ADMIN_PASSWORD = "<external-password>"
$env:KHARON_QA_TECH_EMAIL = "tech@example.co.za"
$env:KHARON_QA_TECH_PASSWORD = "<external-password>"
$env:KHARON_QA_FINANCE_EMAIL = "finance@example.co.za"
$env:KHARON_QA_FINANCE_PASSWORD = "<external-password>"
$env:KHARON_QA_CLIENT_EMAIL = "client@example.co.za"
$env:KHARON_QA_CLIENT_PASSWORD = "<external-password>"
npm run portal:qa:roles -- -BaseUrl "https://portal.tequit.co.za" -OutputPath "monitor-results/portal-role-qa.json"
```

If MFA is enabled for a test account, set `KHARON_QA_ADMIN_MFA` or `KHARON_QA_FINANCE_MFA` immediately before the run. Do not store MFA codes, passwords or session cookies in this file.

Harness coverage:

- [ ] `/portal/login` returns HTTP 200.
- [ ] Protected dashboards redirect unauthenticated requests to `/portal/login`.
- [ ] Encoded traversal path returns a safe blocked, redirect or not-found response.
- [ ] Supplied role credentials can authenticate.
- [ ] Expected role dashboard is returned unless password rotation or MFA setup is required.
- [ ] Authenticated dashboard exposes a CSRF token.
- [ ] Missing CSRF token is blocked.
- [ ] Valid CSRF token is accepted for logout.

The harness does not replace the manual data-access and document-access tests below.

## Authentication

- [ ] Valid admin login succeeds and routes to the admin dashboard.
- [ ] Valid technician login succeeds and routes to the technician dashboard.
- [ ] Valid finance login succeeds and routes to the finance dashboard.
- [ ] Valid client login succeeds and routes to the client dashboard.
- [ ] Invalid password fails with a visible error and no session is issued.
- [ ] Disabled user cannot login.
- [ ] Force-password-change user is redirected to `/portal/account/password`.

## MFA

- [ ] Admin can access `/portal/account/mfa`.
- [ ] Finance can access `/portal/account/mfa`.
- [ ] Technician and client accounts see that MFA is not required for their role.
- [ ] Admin can mark an admin or finance account as MFA-required from `/portal/admin/operations`.
- [ ] MFA-required admin or finance user is redirected to `/portal/account/mfa` after password rotation.
- [ ] MFA setup generates an authenticator setup key and provisioning URI.
- [ ] Invalid MFA enable code is rejected and audit logged.
- [ ] Valid MFA enable code turns MFA on and redirects to the correct dashboard.
- [ ] Login for an MFA-enabled account fails without a 6-digit authenticator code.
- [ ] Login for an MFA-enabled account fails with an invalid authenticator code.
- [ ] Login for an MFA-enabled account succeeds with a valid authenticator code.
- [ ] User can disable MFA only with a valid current authenticator code.
- [ ] Admin can reset MFA for an admin or finance account after identity verification.

## RBAC Routing

- [ ] Client accessing `/portal/admin/dashboard` redirects or blocks.
- [ ] Client accessing `/portal/finance/dashboard` redirects or blocks.
- [ ] Finance accessing `/portal/admin/dashboard` redirects or blocks.
- [ ] Technician accessing `/portal/admin/dashboard` redirects or blocks.
- [ ] Admin can access `/portal/admin/dashboard`.
- [ ] Admin can access `/portal/finance/dashboard` as intended by current middleware.
- [ ] Admin can access `/portal/tech/dashboard` as intended by current middleware.

## Data Access

- [ ] Client sees only mapped site systems.
- [ ] Client cannot download another site's jobcard.
- [ ] Technician sees assigned jobs only.
- [ ] Technician cannot close another technician's job.
- [ ] Finance can see ledger records but cannot access admin operations unless explicitly authorized.
- [ ] Admin can see all operational records.

## State-Changing Actions

- [ ] Missing CSRF token is blocked with HTTP 403.
- [ ] Invalid CSRF token is blocked with HTTP 403.
- [ ] Valid CSRF token is accepted for authorized actions.
- [ ] Rate limit exceeded returns HTTP 429 and a `retry-after` response header.
- [ ] Audit events are recorded for success, failure and blocked attempts where applicable.

## Documents

- [ ] Valid jobcard PDF download works.
- [ ] Valid jobcard PDF download creates a `document_access_logs` success row.
- [ ] Invalid jobcard path is blocked.
- [ ] Invalid or unauthorized jobcard path creates a `document_access_logs` blocked/failure row where a valid portal session exists.
- [ ] Path traversal is blocked.
- [ ] Missing document returns a safe error.
- [ ] Evidence photo download creates a `document_access_logs` success row.
- [ ] Document access log includes actor role, storage path, document type, outcome and site context where available.
